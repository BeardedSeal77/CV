from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view
from jobs.model.schema import COLUMN_OF, Column, Status


class ListJobs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    column: Column | None = Field(None, description="Only this board column")
    status: Status | None = None
    country: str | None = Field(None, description="ISO country code, e.g. LV, LT, PL")
    company: str | None = None
    text: str | None = Field(None, description="Matches company, role or city")
    include_archived: bool = Field(False, description="Include Ruled out jobs (the hidden archive)")


def list_jobs(payload: ListJobs) -> dict:
    """List jobs as board cards (column, status, dates, method), with summary
    numbers and a change fingerprint (version). Archived jobs are left out unless
    column is "archived" or include_archived is true."""
    opps = store.list_all()
    needle = (payload.text or "").lower()

    def keep(o) -> bool:
        col = COLUMN_OF[o.application.status]
        return (
            (col == payload.column if payload.column else payload.include_archived or col != "archived")
            and (not payload.status or o.application.status == payload.status)
            and (not payload.country or o.country.lower() == payload.country.lower())
            and (not payload.company or payload.company.lower() in o.company.lower())
            and (not needle or needle in f"{o.company} {o.role} {o.city}".lower())
        )

    return {
        "jobs": [view.summary(o) for o in opps if keep(o)],
        "stats": view.stats(opps),
        "version": store.version(),
    }
