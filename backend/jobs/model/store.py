"""The only code that reads or writes data/jobhunt. Every write is validated,
locked per opportunity and atomic."""

import json
import logging
import re
import time
import unicodedata
from datetime import date
from pathlib import Path

from utils.datadir import data_dir, jobhunt_dir
from utils.errors import ActionError, NotFound
from utils.files import folder_lock, write_atomic

from .schema import DOCS, OPPORTUNITY_ID, Application, JobEvent, Listing, Opportunity

log = logging.getLogger("jobs.store")
# jd_en: an English translation of a description in another language
DOC_FILES = {"jd": "jd.md", "jd_en": "jd.en.md", "letter": "letter.md", "notes": "notes.md"}


def today() -> str:
    return date.today().isoformat()


def opportunities_dir() -> Path:
    return jobhunt_dir() / "opportunities"


def opp_dir(job_id: str) -> Path:
    if not OPPORTUNITY_ID.match(job_id or ""):
        raise ActionError(f"Invalid job id: {job_id}")
    return opportunities_dir() / job_id


def letter_path(job_id: str) -> Path:
    return opp_dir(job_id) / DOC_FILES["letter"]


def exists(job_id: str) -> bool:
    return bool(OPPORTUNITY_ID.match(job_id or "")) and (opp_dir(job_id) / "opportunity.json").is_file()


def read(job_id: str) -> Opportunity:
    path = opp_dir(job_id) / "opportunity.json"
    if not path.is_file():
        raise NotFound(f"No job {job_id}")
    return Opportunity.model_validate(json.loads(path.read_text(encoding="utf-8")))


def _write(opp: Opportunity) -> Path:
    path = opp_dir(opp.id) / "opportunity.json"
    write_atomic(path, json.dumps(opp.to_json(), ensure_ascii=False, indent=2) + "\n")
    return path


def read_doc(job_id: str, doc: str) -> str:
    path = opp_dir(job_id) / DOC_FILES[doc]
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _write_doc(job_id: str, doc: str, text: str) -> Path:
    path = opp_dir(job_id) / DOC_FILES[doc]
    write_atomic(path, text.replace("\r\n", "\n").rstrip() + "\n")
    return path


def list_all() -> list[Opportunity]:
    folder = opportunities_dir()
    if not folder.is_dir():
        return []
    out = []
    for entry in sorted(folder.iterdir()):
        if not entry.is_dir() or not OPPORTUNITY_ID.match(entry.name):
            continue
        try:
            out.append(read(entry.name))
        except Exception as err:  # one broken file never hides the rest
            log.warning("Skipping %s: %s", entry.name, err)
    return out


def get_with_docs(job_id: str) -> dict:
    opp = read(job_id)
    return {"opportunity": opp, **{doc: read_doc(job_id, doc) for doc in DOCS}}


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:50]


def _norm_url(url: str) -> str:
    return url.strip().split("#", 1)[0].rstrip("/").lower()


def find_duplicate(listing: Listing) -> Opportunity | None:
    """A job already on the board with the same listing link, or the same
    company and role."""
    url = _norm_url(listing.url)
    key = (listing.company.strip().lower(), listing.role.strip().lower())
    for opp in list_all():
        if (url and _norm_url(opp.url) == url) or (opp.company.strip().lower(), opp.role.strip().lower()) == key:
            return opp
    return None


def add(
    listing: Listing, jd: str = "", letter: str = "", job_id: str | None = None, allow_duplicate: bool = False
) -> Opportunity:
    if not allow_duplicate:
        existing = find_duplicate(listing)
        if existing:
            raise ActionError(
                f"Already on the board as {existing.id} ({existing.company}: {existing.role}).",
                code="duplicate",
                existing_id=existing.id,
            )
    base = job_id or _slugify(f"{listing.company}-{listing.role}")
    if not OPPORTUNITY_ID.match(base or ""):
        base = f"opp-{int(time.time())}"
    new_id, n = base, 2
    while exists(new_id):
        new_id, n = f"{base}-{n}", n + 1
    opp_dir(new_id).mkdir(parents=True)
    opp = Opportunity(
        id=new_id,
        **{**listing.model_dump(), "added": listing.added or today()},
        application=Application(
            status="Shortlisted",
            updated=today(),
            events=[JobEvent(date=today(), status="Shortlisted", note="Added.")],
        ),
    )
    with folder_lock(opp_dir(new_id)):
        files = [_write(opp)]
        if jd.strip():
            files.append(_write_doc(new_id, "jd", jd))
        if letter.strip():
            files.append(_write_doc(new_id, "letter", letter))
    return opp


def update_listing(job_id: str, changes: dict) -> Opportunity:
    with folder_lock(opp_dir(job_id)):
        current = read(job_id)
        merged = Opportunity.model_validate({**current.model_dump(), **changes})
        _write(merged)
    return merged


def log_event(job_id: str, event: JobEvent) -> Opportunity:
    if not event.status and not event.note.strip():
        raise ActionError("An event needs a note or a status.")
    with folder_lock(opp_dir(job_id)):
        opp = read(job_id)
        if _seen(opp, event):
            return opp  # the same email (or other source) was logged already
        opp.application.events.append(event)
        if event.status:
            opp.application.status = event.status
        opp.application.updated = today()
        _write(opp)
    return opp


def _seen(opp: Opportunity, event: JobEvent) -> bool:
    return bool(event.source) and any(
        e.source == event.source and e.status == event.status for e in opp.application.events
    )


def already_logged(job_id: str, event: JobEvent) -> bool:
    """Whether this exact update (same source and status) is on the timeline."""
    return _seen(read(job_id), event)


def set_doc(job_id: str, doc: str, text: str) -> None:
    if not exists(job_id):
        raise NotFound(f"No job {job_id}")
    with folder_lock(opp_dir(job_id)):
        _write_doc(job_id, doc, text)


def version() -> str:
    """A cheap fingerprint of every opportunity file, matching the Node store's,
    so a poller can tell when anything changed."""
    folder = opportunities_dir()
    if not folder.is_dir():
        return "0"
    latest, count = 0.0, 0
    for entry in folder.iterdir():
        if not entry.is_dir():
            continue
        count += 1
        for file in entry.iterdir():
            if not file.name.startswith("."):
                try:
                    latest = max(latest, file.stat().st_mtime * 1000)
                except FileNotFoundError:
                    pass
    return f"{count}-{round(latest)}"
