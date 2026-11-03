from pydantic import BaseModel, ConfigDict, Field, model_validator

from jobs.model import store, view
from jobs.model.schema import COLUMN_OF, DEFAULT_STATUS, Column, JobEvent, Status


class MoveJob(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    column: Column = Field(description="backlog, applied, interview, accepted, declined or archived")
    status: Status | None = Field(
        None,
        description="Detail within the column, e.g. Screening (interview), Accepted (accepted), "
        "Withdrawn or Closed (declined). Defaults to the column's usual status.",
    )
    date: str | None = Field(None, description="YYYY-MM-DD, defaults to today")
    note: str = ""
    link: str | None = Field(None, description="e.g. the email thread")
    correction: bool = Field(False, description="Allow a move the lifecycle doesn't, to fix a mistake")

    @model_validator(mode="after")
    def _status(self):
        self.status = self.status or DEFAULT_STATUS[self.column]
        if COLUMN_OF[self.status] != self.column:
            raise ValueError(f'Status "{self.status}" belongs in {COLUMN_OF[self.status]}, not {self.column}.')
        return self


def move_job(payload: MoveJob) -> dict:
    """Move a job to a board column by logging a dated event. Default statuses:
    backlog -> Shortlisted, applied -> Applied, interview -> Interview, accepted ->
    Offer, declined -> Rejected, archived -> Ruled out. Moves follow the
    application lifecycle; pass correction=true to fix a mistake."""
    event = JobEvent(
        date=payload.date or store.today(),
        status=payload.status,
        note=payload.note.strip() or f"Moved to {payload.status}.",
        link=payload.link,
    )
    return view.summary(store.log_event(payload.id, event))
