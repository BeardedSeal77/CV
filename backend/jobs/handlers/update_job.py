from pydantic import BaseModel, ConfigDict, Field

from jobs.model import pay_link, store, view
from jobs.model.schema import Interest, Method, Salary


class UpdateJob(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    company: str | None = None
    role: str | None = None
    country: str | None = None
    city: str | None = None
    city_id: str | None = Field(None, description="The pay data's city file; found from city when left out")
    platform: str | None = None
    method: Method | None = None
    url: str | None = Field(None, description="The application link")
    website: str | None = Field(None, description="The company's own website")
    email: str | None = None
    pay: str | None = Field(None, description="As the listing writes it; salary is read from it")
    salary: Salary | None = Field(None, description="currency, min, max, ask, period (month, year, hour), basis (gross, net)")
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
    letter_date: str | None = Field(
        None, description='A fixed date for the letter, YYYY-MM-DD, only when one is needed; "" prints the day it renders'
    )
    found_via: str | None = Field(None, description='Where Ed found the listing, e.g. "Indeed", "LinkedIn", "Referral"')
    size: str | None = None
    what: str | None = None


def update_job(payload: UpdateJob) -> dict:
    """Change a job's listing fields; only the fields you pass change. Not its
    column or status: use jobs.move. A new city re-finds city_id and new pay
    text re-reads salary (keeping a recorded ask), unless you pass them."""
    changes = payload.model_dump(exclude={"id"}, exclude_none=True)
    changes, note = pay_link.derive(changes, store.read(payload.id).model_dump())
    return {**view.summary(store.update_listing(payload.id, changes)), "city_note": note or None}
