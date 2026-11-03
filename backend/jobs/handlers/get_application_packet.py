from urllib.parse import quote

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pay_link, pdf, store
from jobs.model.letter import split_letter
from jobs.model.profile import read_profile, repo_relative
from utils.errors import ActionError


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
    Never invent an answer the profile doesn't give: ask Ed."""
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
        "pay_check": pay_link.pay_check(opp),
        "profile": read_profile(),
        "letter": letter,
        "files": files,
    }
