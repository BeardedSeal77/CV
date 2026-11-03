from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view
from jobs.model.schema import Interest, Method


class UpdateJob(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    company: str | None = None
    role: str | None = None
    country: str | None = None
    city: str | None = None
    platform: str | None = None
    method: Method | None = None
    url: str | None = Field(None, description="The application link")
    website: str | None = Field(None, description="The company's own website")
    email: str | None = None
    pay: str | None = None
    hours: str | None = None
    mode: str | None = None
    fit: str | None = None
    interest: Interest | None = Field(None, description="High, Medium or Low: how keen Ed is")
    posted: str | None = Field(None, description="Date listed, YYYY-MM-DD")
    deadline: str | None = Field(
        None,
        description="The listing's closing date, YYYY-MM-DD, only when it gives one; \"\" clears it. "
        "jobs.expire_closed moves jobs past it to Expired.",
    )
    size: str | None = None
    what: str | None = None


def update_job(payload: UpdateJob) -> dict:
    """Change a job's listing fields; only the fields you pass change. Not its
    column or status: use jobs.move."""
    changes = payload.model_dump(exclude={"id"}, exclude_none=True)
    return view.summary(store.update_listing(payload.id, changes))
