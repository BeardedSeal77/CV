from urllib.parse import quote

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pdf, store
from jobs.model.letter import split_letter
from jobs.model.profile import read_profile, repo_relative
from utils.errors import ActionError


class ApplicationPacket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    build_files: bool = Field(True, description="Print the PDFs now (needs the website running)")
    portfolio: bool = Field(False, description="Also build the CV with the portfolio behind")


def get_application_packet(payload: ApplicationPacket) -> dict:
    """Everything needed to fill in this job's application form: where to apply,
    the applicant profile (contact details and standard answers: notice period,
    work authorisation, salary expectation...), the cover letter text, and fresh
    PDFs to upload (the letter alone, the CV alone, and both in one), each with
    its path in the repo and its download link on the website. Never invent an
    answer the profile doesn't give: ask Ed."""
    data = store.get_with_docs(payload.id)
    opp = data["opportunity"]
    letter = split_letter(data["letter"])["text"]
    if not letter:
        raise ActionError("This job has no cover letter yet: draft one first (jobs.letter_brief).", code="no_letter")

    files = []
    if payload.build_files:
        builds = [("letter", {"kind": "letter"}), ("cv", {"cover_letter": False}), ("application", {})]
        if payload.portfolio:
            builds.append(("cv_with_portfolio", {"cover_letter": False, "portfolio": True}))
        for kind, options in builds:
            built = pdf.build(opp.id, **options)
            path = pdf.output_file(opp.id, built["name"])
            files.append(
                {
                    "kind": kind,
                    "name": built["name"],
                    "path": repo_relative(path) if path else built["file"],
                    "url": f"/api/pdf/{opp.id}?name={quote(built['name'])}",
                }
            )

    return {
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
        "profile": read_profile(),
        "letter": letter,
        "files": files,
    }
