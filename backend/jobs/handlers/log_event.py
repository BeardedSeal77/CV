from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view
from jobs.model.schema import JobEvent, Status


class LogEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    date: str | None = Field(None, description="YYYY-MM-DD, defaults to today")
    status: Status | None = Field(None, description="Optional status change, e.g. Interview for another round")
    note: str = ""
    link: str | None = Field(None, description="e.g. the email thread")
    correction: bool = Field(False, description="Allow a status change the lifecycle doesn't, to fix a mistake")


def log_event(payload: LogEvent) -> dict:
    """Add a dated update to a job's timeline: a note, another interview round
    (status Interview), or a status change that follows the lifecycle."""
    event = JobEvent(date=payload.date or store.today(), status=payload.status, note=payload.note, link=payload.link)
    return view.summary(store.log_event(payload.id, event))
