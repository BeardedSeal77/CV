from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pdf


class BuildPdf(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: Literal["application", "letter"] = Field(
        "application", description='"letter" is the cover letter alone; "application" is the CV'
    )
    coverLetter: bool = Field(True, description="application only: the cover letter in front")
    portfolio: bool = Field(False, description="application only: the portfolio at the back")


def build_pdf(payload: BuildPdf) -> dict:
    """Print a PDF into jobhunt/output/<id>/: the cover letter alone, the CV, or
    the CV with the letter in front and/or the portfolio behind. Needs the
    website running (npm run local). Returns file, name and page counts."""
    return pdf.build(payload.id, payload.kind, payload.coverLetter, payload.portfolio)
