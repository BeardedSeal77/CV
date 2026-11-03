from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pay_link, store, view
from jobs.model.schema import JobEvent, Status


class LogEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    date: str | None = Field(None, description="YYYY-MM-DD, defaults to today")
    status: Status | None = Field(None, description="Optional status change, e.g. Interview for another round")
    note: str = ""
    link: str | None = Field(None, description="e.g. the email thread")
    source: str | None = Field(
        None, description='Where it came from, e.g. "gmail:<thread id>"; the same source and status is logged once'
    )
    correction: bool = Field(False, description="Allow a status change the lifecycle doesn't, to fix a mistake")


def log_event(payload: LogEvent) -> dict:
    """Add a dated update to a job's timeline: a note, another interview round
    (status Interview), an email from the company, or a status change that
    follows the lifecycle. With a source, logging the same update again does
    nothing and answers duplicate: true. An Offer keeps the pay check as it
    was that day."""
    event = JobEvent(
        date=payload.date or store.today(),
        status=payload.status,
        note=payload.note,
        link=payload.link,
        source=payload.source,
    )
    if payload.status == "Offer":
        event.pay_check = pay_link.pay_check(store.read(payload.id))
    duplicate = store.already_logged(payload.id, event)
    return {**view.summary(store.log_event(payload.id, event)), "duplicate": duplicate}
