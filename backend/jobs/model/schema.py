"""The job hunt's data model: one opportunity.json per job, plus jd.md,
letter.md and notes.md beside it. Statuses keep their detail; the board groups
them into columns."""

import re
from typing import Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    "Ruled out",
]
STATUSES: tuple[str, ...] = get_args(Status)

Column = Literal["backlog", "applied", "interview", "accepted", "declined", "archived"]
COLUMNS: tuple[str, ...] = get_args(Column)

COLUMN_LABEL = {
    "backlog": "Backlog",
    "applied": "Applied",
    "interview": "Interview",
    "accepted": "Accepted",
    "declined": "Declined",
    "archived": "Archived",
}

# Screening calls count as interviewing; offers sit in Accepted (the status says
# whether Ed has accepted yet); Ruled out roles were never applied to and live
# in a hidden archive.
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
    "Ruled out": "archived",
}

# The status a card gets when it's moved into a column without one
DEFAULT_STATUS: dict[str, str] = {
    "backlog": "Shortlisted",
    "applied": "Applied",
    "interview": "Interview",
    "accepted": "Offer",
    "declined": "Rejected",
    "archived": "Ruled out",
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
    "Ruled out": "closed",
}

# How the application is made; `platform` keeps the detail (Workable, Lever, ...)
Method = Literal["indeed", "company_site", "linkedin", "other"]
METHODS: tuple[str, ...] = get_args(Method)

OPPORTUNITY_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,79}$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DOCS = ("jd", "letter", "notes")


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


LISTING_FIELDS = (
    "company",
    "role",
    "country",
    "city",
    "platform",
    "method",
    "url",
    "website",
    "email",
    "pay",
    "hours",
    "mode",
    "fit",
    "posted",
    "deadline",
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
    platform: str = ""
    method: Method = "other"
    url: str = ""  # the application link
    website: str = ""  # the company's own website
    email: str = ""
    pay: str = ""
    hours: str = ""
    mode: str = ""
    fit: str = ""
    posted: str = ""  # when the role was listed
    deadline: str = ""
    size: str = ""
    what: str = ""
    added: str = ""  # when it was added to the board

    @field_validator("posted", "deadline", "added")
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
        ordered = {"id": self.id, **{k: data[k] for k in LISTING_FIELDS}}
        ordered["application"] = {
            "status": self.application.status,
            "updated": self.application.updated,
            "events": [e.model_dump(exclude_none=True) for e in self.application.events],
        }
        return ordered
