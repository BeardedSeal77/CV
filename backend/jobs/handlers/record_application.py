from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view
from jobs.model.schema import JobEvent, Method


class RecordApplication(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    status: str = Field("Applied", description='Always "Applied"; bound to the lifecycle like jobs.move')
    date: str | None = Field(None, description="YYYY-MM-DD, defaults to today")
    method: Method | None = Field(None, description="How it was sent, when it differs from the listing's")
    sent: list[str] = Field(default_factory=list, description="What was submitted, e.g. the PDF names")
    salary_quoted: str = Field("", description="Any salary expectation entered on the form")
    note: str = Field("", description="Anything else worth remembering about this application")
    link: str | None = Field(None, description="e.g. the confirmation email or page")


def record_application(payload: RecordApplication) -> dict:
    """Record that Ed's application was submitted: moves the job to Applied with
    a dated event saying what was sent. Call it only after the submit went
    through."""
    if payload.status != "Applied":
        payload.status = "Applied"
    parts = ["Applied" + (f" via {payload.method.replace('_', ' ')}" if payload.method else "") + "."]
    if payload.sent:
        parts.append(f"Sent: {', '.join(payload.sent)}.")
    if payload.salary_quoted:
        parts.append(f"Salary quoted: {payload.salary_quoted}.")
    if payload.note.strip():
        parts.append(payload.note.strip())
    event = JobEvent(date=payload.date or store.today(), status="Applied", note=" ".join(parts), link=payload.link)
    opp = store.log_event(payload.id, event)
    if payload.method and payload.method != opp.method:
        opp = store.update_listing(payload.id, {"method": payload.method})
    return view.summary(opp)
