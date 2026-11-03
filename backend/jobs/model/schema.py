"""The job hunt's data model: one opportunity.json per job, plus jd.md,
letter.md and notes.md beside it. Statuses keep their detail; the board groups
them into columns."""

import re
from typing import Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Status = Literal[
    "Shortlisted",
    "Ready",
    "Applied",
    "Screening",
    "Interview",
    "Offer",
    "Accepted",
    "Rejected",
    "Withdrawn",
    "Closed",
    "Not interested",
    "Expired",
]
STATUSES: tuple[str, ...] = get_args(Status)

Column = Literal[
    "backlog", "applied", "interview", "accepted", "declined", "not_interested", "expired"
]
COLUMNS: tuple[str, ...] = get_args(Column)

COLUMN_LABEL = {
    "backlog": "Backlog",
    "applied": "Applied",
    "interview": "Interview",
    "accepted": "Accepted",
    "declined": "Declined",
    "not_interested": "Not interested",
    "expired": "Expired",
}

# Screening calls count as interviewing; offers sit in Accepted (the status says whether
# Ed has accepted yet). Closed means the company closed the role after Ed
# applied; Expired means the listing closed before he did.
COLUMN_OF: dict[str, str] = {
    "Shortlisted": "backlog",
    "Ready": "backlog",
    "Applied": "applied",
    "Screening": "interview",
    "Interview": "interview",
    "Offer": "accepted",
    "Accepted": "accepted",
    "Rejected": "declined",
    "Withdrawn": "declined",
    "Closed": "declined",
    "Not interested": "not_interested",
    "Expired": "expired",
}

# The status a card gets when it's moved into a column without one
DEFAULT_STATUS: dict[str, str] = {
    "backlog": "Shortlisted",
    "applied": "Applied",
    "interview": "Interview",
    "accepted": "Offer",
    "declined": "Rejected",
    "not_interested": "Not interested",
    "expired": "Expired",
}

STATUS_GROUP: dict[str, str] = {
    "Shortlisted": "todo",
    "Ready": "todo",
    "Applied": "active",
    "Screening": "active",
    "Interview": "active",
    "Offer": "active",
    "Accepted": "closed",
    "Rejected": "closed",
    "Withdrawn": "closed",
    "Closed": "closed",
    "Not interested": "closed",
    "Expired": "closed",
}

# How the application is made; `platform` keeps the detail (Workable, Lever, ...)
Method = Literal["indeed", "company_site", "linkedin", "other"]
METHODS: tuple[str, ...] = get_args(Method)

# How keen Ed is on a role; the board groups every column into these bands
Interest = Literal["High", "Medium", "Low"]
INTERESTS: tuple[str, ...] = get_args(Interest)
_INTEREST_OF_FIT = {"strong": "High", "good": "Medium"}


def interest_from_fit(fit: str) -> str:
    """The interest a job starts with when none is given: Strong fits High,
    Good fits Medium, anything else Low."""
    return _INTEREST_OF_FIT.get(fit.strip().lower(), "Low")

OPPORTUNITY_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,79}$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DOCS = ("jd", "jd_en", "letter", "notes")


def check_date(value: str, *, optional: bool = True) -> str:
    if (optional and value == "") or ISO_DATE.match(value):
        return value
    raise ValueError("Use YYYY-MM-DD")


class JobEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str
    status: Status | None = None
    note: str = ""
    link: str | None = None
    # Where the update came from, e.g. "gmail:<thread id>", so a rescan of the
    # same email never logs it twice
    source: str | None = None
    # The pay check when an offer arrived, kept as it was then
    pay_check: dict | None = None
    # Proof kept in the job's folder, e.g. evidence/2026-11-03-confirmation.png
    evidence: list[str] | None = None

    @field_validator("date")
    @classmethod
    def _date(cls, v: str) -> str:
        return check_date(v, optional=False)


class Application(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Status
    updated: str = ""
    events: list[JobEvent] = Field(default_factory=list)

    @field_validator("updated")
    @classmethod
    def _date(cls, v: str) -> str:
        return check_date(v)


class Salary(BaseModel):
    """What a job pays, read from its pay text or set by hand."""

    model_config = ConfigDict(extra="forbid")

    currency: str = Field(min_length=3, max_length=3, description="e.g. EUR, PLN")
    min: float | None = Field(None, gt=0)
    max: float | None = Field(None, gt=0)
    ask: float | None = Field(None, gt=0, description="What Ed asked for, or will ask")
    period: Literal["month", "year", "hour"] = "month"
    basis: Literal["gross", "net"] = "gross"


LISTING_FIELDS = (
    "company",
    "role",
    "country",
    "city",
    "city_id",
    "platform",
    "method",
    "url",
    "website",
    "email",
    "pay",
    "salary",
    "hours",
    "mode",
    "fit",
    "interest",
    "posted",
    "deadline",
    "letter_date",
    "found_via",
    "size",
    "what",
    "added",
)


class Listing(BaseModel):
    """Everything about the role itself, editable as a whole."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    company: str = Field(min_length=1)
    role: str = Field(min_length=1)
    country: str = ""
    city: str = ""
    city_id: str = ""  # the pay data's city file, resolved from city
    platform: str = ""
    method: Method = "other"
    url: str = ""  # the application link
    website: str = ""  # the company's own website
    email: str = ""
    pay: str = ""  # as the listing writes it
    salary: Salary | None = None  # read from pay where possible
    hours: str = ""
    mode: str = ""
    fit: str = ""
    interest: Interest = "Low"
    posted: str = ""  # when the role was listed
    deadline: str = ""
    letter_date: str = ""  # a fixed date for the letter; empty prints the day it renders
    found_via: str = ""  # where Ed found the listing, for "How did you hear about us?"
    size: str = ""
    what: str = ""
    added: str = ""  # when it was added to the board

    @model_validator(mode="before")
    @classmethod
    def _default_interest(cls, data):
        if isinstance(data, dict) and not data.get("interest"):
            data = {**data, "interest": interest_from_fit(str(data.get("fit") or ""))}
        return data

    @field_validator("posted", "deadline", "added", "letter_date")
    @classmethod
    def _dates(cls, v: str) -> str:
        return check_date(v)


class Opportunity(Listing):
    id: str
    application: Application

    @field_validator("id")
    @classmethod
    def _id(cls, v: str) -> str:
        if not OPPORTUNITY_ID.match(v):
            raise ValueError("Invalid opportunity id")
        return v

    def to_json(self) -> dict:
        """The on-disk shape: id first, events without empty optional keys."""
        data = {"id": self.id, **self.model_dump(include=set(LISTING_FIELDS))}
        data["salary"] = self.salary.model_dump(exclude_none=True) if self.salary else None
        ordered = {"id": self.id, **{k: data[k] for k in LISTING_FIELDS}}
        ordered["application"] = {
            "status": self.application.status,
            "updated": self.application.updated,
            "events": [e.model_dump(exclude_none=True) for e in self.application.events],
        }
        return ordered
