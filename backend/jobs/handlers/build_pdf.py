from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pdf

Kind = Literal["cv", "letter", "portfolio", "application", "cv_portfolio", "application_portfolio"]


class BuildPdf(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: Kind = Field("application", description="cv (the CV), letter (the cover letter), portfolio, application (letter then CV in one file), cv_portfolio (CV then portfolio), application_portfolio (all three in one file)")
    force: bool = Field(False, description="Print again even when the PDF is newer than the CV and letter")


def build_pdf(payload: BuildPdf) -> dict:
    """Print one of the application's PDFs into jobhunt/output/<id>/, named
    <prefix>_CV.pdf, <prefix>_Cover_Letter_<Company>.pdf and so on (the prefix
    is the CV's file name in site.md, e.g. ED_Cullen).
    Forms differ, so every combination is a kind: cv (the CV), letter (the cover letter), portfolio, application (letter then CV in one file), cv_portfolio (CV then portfolio), application_portfolio (all three in one file). A PDF newer than
    the CV and the letter is reused (a letter is dated the day it prints, so
    one built on an earlier day is printed again); otherwise it is printed from
    the website. Older files no kind uses any more are removed. Returns kind,
    file, name, size, parts and rebuilt."""
    return pdf.ensure(payload.id, payload.kind, payload.force)
