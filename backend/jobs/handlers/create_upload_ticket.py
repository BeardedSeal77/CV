import os
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from jobs.handlers.build_pdf import Kind
from jobs.model import handoff, pdf

# Where the browser reaches the API: the address published on this machine
HANDOFF_BASE = os.environ.get("CV_HANDOFF_URL", "http://127.0.0.1:5400").rstrip("/")


class UploadTicket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: Kind = Field(description="Which PDF: cv (the CV), letter (the cover letter), portfolio, application (letter then CV in one file), cv_portfolio (CV then portfolio), application_portfolio (all three in one file)")
    origin: str = Field(description="The application form page's origin, e.g. https://kariera.comarch.pl")


def create_upload_ticket(payload: UploadTicket) -> dict:
    """A single-use link, valid 5 minutes, from which the application form's
    own page can fetch one of this job's PDFs, so it can be attached to the
    form's file input. Only a page on exactly that origin can fetch it, once.
    Builds the PDF first when it is missing or older than the CV and letter.

    In the page: fetch(url) -> blob -> new File([blob], name, {type:
    "application/pdf"}); put it in the input through a DataTransfer and
    dispatch input and change events. Use cv for a CV field, letter for a
    separate cover letter field, application when the form takes one file.
    Ed checks the form before anything is submitted."""
    built = pdf.ensure(payload.id, payload.kind)
    ticket = handoff.issue(payload.id, pdf.output_dir(payload.id) / built["name"], payload.origin)
    return {
        "url": f"{HANDOFF_BASE}/handoff/{ticket['token']}",
        "name": built["name"],
        "size": built["size"],
        "kind": payload.kind,
        "origin": ticket["origin"],
        "expires_at": datetime.fromtimestamp(ticket["expires"], timezone.utc).isoformat(timespec="seconds"),
        "rebuilt": built["rebuilt"],
    }
