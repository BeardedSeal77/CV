from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pay_link, store, view
from jobs.model.schema import COLUMN_OF, Column, Status


class ListJobs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    column: Column | None = Field(None, description="Only this board column")
    status: Status | None = None
    country: str | None = Field(None, description="ISO country code, e.g. LV, LT, PL")
    company: str | None = None
    text: str | None = Field(None, description="Matches company, role or city")


def list_jobs(payload: ListJobs) -> dict:
    """List jobs as board cards (column, status, dates, method), with summary
    numbers and a change fingerprint (version). Each card carries pay_grade: its
    headline grade (A-D) and the pay check's status (ok, no_city, no_salary,
    stale_data); jobs.get has the whole check."""
    opps = store.list_all()
    asks = pay_link.profile_asks()
    needle = (payload.text or "").lower()

    def keep(o) -> bool:
        col = COLUMN_OF[o.application.status]
        return (
            (not payload.column or col == payload.column)
            and (not payload.status or o.application.status == payload.status)
            and (not payload.country or o.country.lower() == payload.country.lower())
            and (not payload.company or payload.company.lower() in o.company.lower())
            and (not needle or needle in f"{o.company} {o.role} {o.city}".lower())
        )

    return {
        "jobs": [{**view.summary(o), "pay_grade": pay_link.compact(pay_link.pay_check(o, asks))} for o in opps if keep(o)],
        "stats": view.stats(opps),
        "version": store.version(),
    }
