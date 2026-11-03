"""Single-use tickets that let one web page fetch one application PDF from
this machine, so an agent driving the browser can attach it to a form.

A ticket names a job, one PDF in that job's output folder, and the exact
origin of the page allowed to fetch it. It lives five minutes and dies on its
first successful fetch. Tickets are files (data/jobhunt/output/.handoff/), so
the MCP server can issue one that the API then serves."""

import json
import os
import re
import secrets
import time
from pathlib import Path
from urllib.parse import urlsplit

from utils.datadir import jobhunt_dir
from utils.errors import ActionError, NotFound
from utils.files import write_atomic

from .pdf import output_dir

TICKET_SECONDS = 300
_TOKEN = re.compile(r"^[A-Za-z0-9_-]{40,64}$")
_LOCAL = {"localhost", "127.0.0.1", "[::1]", "::1"}


def tickets_dir() -> Path:
    return jobhunt_dir() / "output" / ".handoff"


def normalise_origin(origin: str) -> str:
    """scheme://host[:port] in lower case. https only, except a page on this
    machine (for testing)."""
    parts = urlsplit((origin or "").strip())
    host = (parts.hostname or "").lower()
    if (
        not host
        or parts.username
        or parts.password
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
        or not (parts.scheme == "https" or (parts.scheme == "http" and host in _LOCAL))
    ):
        raise ActionError(
            f'Not an origin: "{origin}". Pass the form page\'s scheme and host, e.g. https://kariera.comarch.pl',
            code="invalid_origin",
        )
    shown = f"[{host}]" if ":" in host else host
    return f"{parts.scheme}://{shown}{f':{parts.port}' if parts.port else ''}"


def _path(token: str) -> Path | None:
    return tickets_dir() / f"{token}.json" if _TOKEN.match(token or "") else None


def _prune() -> None:
    folder = tickets_dir()
    if not folder.is_dir():
        return
    now = time.time()
    for path in folder.glob("*.json"):
        try:
            if json.loads(path.read_text(encoding="utf-8"))["expires"] < now:
                path.unlink(missing_ok=True)
        except (OSError, ValueError, KeyError):
            path.unlink(missing_ok=True)


def issue(job_id: str, file: Path, origin: str) -> dict:
    """A ticket for one built PDF of the job, for one page origin."""
    _prune()
    tickets_dir().mkdir(parents=True, exist_ok=True)
    token = secrets.token_urlsafe(32)
    expires = time.time() + TICKET_SECONDS
    ticket = {"job_id": job_id, "name": file.name, "origin": normalise_origin(origin), "expires": expires}
    write_atomic(tickets_dir() / f"{token}.json", json.dumps(ticket))
    return {"token": token, **ticket}


def _read(token: str) -> tuple[Path, dict]:
    path = _path(token)
    try:
        return path, json.loads(path.read_text(encoding="utf-8"))  # type: ignore[union-attr]
    except (AttributeError, OSError, ValueError):
        raise NotFound("No such hand-off: it was used, has expired, or never existed.") from None


def _origin_matches(ticket: dict, origin: str) -> bool:
    try:
        return normalise_origin(origin) == ticket["origin"]
    except ActionError:
        return False


def check(token: str, origin: str) -> dict:
    """A live ticket for this origin, without using it (for the browser's
    preflight). Refuses a wrong origin or an expired ticket."""
    path, ticket = _read(token)
    if ticket["expires"] < time.time():
        path.unlink(missing_ok=True)
        raise ActionError("This hand-off has expired.", status=410, code="expired")
    if not _origin_matches(ticket, origin):
        raise ActionError("This hand-off is for another page.", status=403, code="wrong_origin")
    return ticket


def claim(token: str, origin: str) -> dict:
    """Use the ticket: returns the job id and the PDF's path. A wrong origin
    leaves the ticket for the right page; anything else ends it."""
    ticket = check(token, origin)
    path = _path(token)
    # Renaming is atomic: of two fetches at once, only one finds the file
    claimed = path.with_name(f"{token}.{secrets.token_hex(4)}.claimed")
    try:
        os.replace(path, claimed)
    except FileNotFoundError:
        raise NotFound("No such hand-off: it was used, has expired, or never existed.") from None
    claimed.unlink(missing_ok=True)

    folder = output_dir(ticket["job_id"]).resolve()
    file = (folder / ticket["name"]).resolve()
    if file.parent != folder or file.suffix.lower() != ".pdf" or not file.is_file():
        raise ActionError("The ticket names a file outside the job's PDFs.", status=403, code="outside_output")
    return {"job_id": ticket["job_id"], "path": str(file), "name": file.name, "origin": ticket["origin"]}
