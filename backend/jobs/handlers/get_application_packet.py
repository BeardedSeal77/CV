import os
from pathlib import Path, PurePosixPath, PureWindowsPath
from urllib.parse import quote

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pay_link, pdf, store
from jobs.model.letter import split_letter
from jobs.model.history import METHOD_LABEL, applied_before, warning
from jobs.model.profile import form_answers, read_profile, repo_relative
from jobs.model.salary import parse_pay
from utils.datadir import REPO_ROOT
from utils.errors import ActionError


def _host_root() -> str | None:
    """The repo folder on Ed's machine, for paths a browser agent can upload
    from: CV_HOST_ROOT, or this folder when the backend isn't in a container."""
    configured = os.environ.get("CV_HOST_ROOT", "").strip()
    if configured:
        return configured
    return None if Path("/.dockerenv").exists() else str(REPO_ROOT)


def _host_path(relative: str) -> str | None:
    root = _host_root()
    if not root:
        return None
    flavour = PureWindowsPath if ("\\" in root or ":" in root[:3]) else PurePosixPath
    return str(flavour(root, *relative.split("/")))


def _salary(opp, profile: dict) -> dict | None:
    """What to type in a salary box: the job's recorded ask, else Ed's usual
    one for the country; plain words, no slash ("gross per month")."""
    if opp.salary and opp.salary.ask:
        amount, currency, source = opp.salary.ask, opp.salary.currency, "recorded for this job"
    else:
        expected = profile.get("salary_expectations") or {}
        usual = parse_pay(expected.get(opp.country) or expected.get("default") or "")
        if not usual:
            return None
        amount, currency, source = usual.get("ask") or usual["min"], usual["currency"], "Ed's usual ask for the country"
    text = f"{currency} {amount:,.0f} gross per month"
    return {"amount": amount, "currency": currency, "text": text, "chars": len(text), "source": source}


class ApplicationPacket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    build_files: bool = Field(True, description="Print the PDFs now (needs the website running)")
    portfolio: bool = Field(False, description="Also build the portfolio kinds (portfolio, cv_portfolio, application_portfolio)")


def get_application_packet(payload: ApplicationPacket) -> dict:
    """Everything needed to fill in this job's application form: where to apply,
    the applicant profile (contact details and standard answers: notice period,
    work authorisation, salary expectation...), the cover letter text, and the
    PDFs to upload, up to date: cv, letter and application (letter then CV in
    one file), plus the portfolio kinds when asked. Attach them to the form with
    jobs.upload_ticket: cv for a CV field, letter for a separate cover letter
    field, application when the form takes one file. Also the pay
    check with the city's targets and Blue Card minimum: pick a salary ask
    above the minimum, at grade B or better where the listed range allows.
    already_applied (with a warning) says Ed applied before: stop and ask him.
    form_answers gives every standard answer in full and in short, form-safe
    versions with character counts; how_heard, links (CV site, GitHub,
    LinkedIn, in that order) and salary are ready to type, and each file has an
    upload_path on Ed's machine for staging. Never invent an answer the profile
    doesn't give: ask Ed."""
    data = store.get_with_docs(payload.id)
    opp = data["opportunity"]
    letter = split_letter(data["letter"])["text"]
    if not letter:
        raise ActionError("This job has no cover letter yet: draft one first (jobs.letter_brief).", code="no_letter")

    files = []
    if payload.build_files:
        kinds = ["cv", "letter", "application"]
        if payload.portfolio:
            kinds += ["portfolio", "cv_portfolio", "application_portfolio"]
        for kind in kinds:
            built = pdf.ensure(opp.id, kind)
            files.append(
                {
                    "kind": kind,
                    "name": built["name"],
                    "size": built["size"],
                    "path": repo_relative(pdf.output_dir(opp.id) / built["name"]),
                    "upload_path": _host_path(repo_relative(pdf.output_dir(opp.id) / built["name"])),
                    "url": f"/api/pdf/{opp.id}?name={quote(built['name'])}",
                }
            )

    profile = read_profile()
    contact = profile.get("contact", {})
    applied = applied_before(opp)
    return {
        "already_applied": applied,
        "warning": warning(applied),
        "job": {
            "id": opp.id,
            "company": opp.company,
            "role": opp.role,
            "status": opp.application.status,
            "apply_at": opp.url,
            "apply_email": opp.email,
            "method": opp.method,
            "platform": opp.platform,
            "country": opp.country,
            "city": opp.city,
            "pay": opp.pay,
        },
        "how_heard": opp.found_via or opp.platform or METHOD_LABEL.get(opp.method, "") or None,
        "links": [
            {"label": label, "url": contact.get(key)}
            for key, label in (("website", "CV website"), ("github", "GitHub"), ("linkedin", "LinkedIn"))
            if contact.get(key)
        ],
        "salary": _salary(opp, profile),
        "form_answers": form_answers(profile),
        "pay_check": pay_link.pay_check(opp),
        "profile": profile,
        "letter": letter,
        "files": files,
    }
