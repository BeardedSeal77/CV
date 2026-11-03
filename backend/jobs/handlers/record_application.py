import re

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import evidence, pay_link, store, view
from jobs.model.schema import JobEvent, Method


class RecordApplication(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    status: str = Field("Applied", description='Always "Applied"; bound to the lifecycle like jobs.move')
    date: str | None = Field(None, description="YYYY-MM-DD, defaults to today")
    method: Method | None = Field(None, description="How it was sent, when it differs from the listing's")
    sent: list[str] = Field(
        default_factory=list,
        description="What was submitted, e.g. the PDF names; files handed to the form with jobs.upload_ticket are added",
    )
    salary_quoted: str = Field(
        "", description='Any salary expectation entered on the form, e.g. "EUR 6,000"; it becomes the salary ask'
    )
    note: str = Field("", description="Anything else worth remembering about this application")
    link: str | None = Field(None, description="e.g. the confirmation email or page")
    confirmation_url: str = Field("", description="The page shown after submitting")
    confirmation_text: str = Field("", description="What that page (or the confirmation email) says")
    reference: str = Field("", description="Any application or ATS reference number")
    screenshot: str = Field("", description="A screenshot of the confirmation page: base64 PNG or JPEG")


_HANDED = re.compile(r"^Handed (.+) to (\S+)\.$")


def _handed_since_last_move(opp) -> list[str]:
    """The PDFs handed to a form since the job last changed status."""
    events = opp.application.events
    last_move = max((i for i, e in enumerate(events) if e.status), default=-1)
    names = []
    for event in events[last_move + 1 :]:
        match = _HANDED.match(event.note) if (event.source or "").startswith("handoff:") else None
        if match:
            names.append(match.group(1))
    return names


def record_application(payload: RecordApplication) -> dict:
    """Record that Ed's application was submitted: moves the job to Applied with
    a dated event saying what was sent, including every PDF handed to the form
    since the job last moved. Keep proof: the confirmation page's url and text,
    any reference, and a screenshot, saved in the job's evidence folder. Call it
    only after the submit went through."""
    if payload.status != "Applied":
        payload.status = "Applied"
    parts = ["Applied" + (f" via {payload.method.replace('_', ' ')}" if payload.method else "") + "."]
    attached = list(dict.fromkeys([*payload.sent, *_handed_since_last_move(store.read(payload.id))]))
    if attached:
        parts.append(f"Sent: {', '.join(attached)}.")
    if payload.salary_quoted:
        parts.append(f"Salary quoted: {payload.salary_quoted}.")
    if payload.note.strip():
        parts.append(payload.note.strip())
    day = payload.date or store.today()
    kept = evidence.save(
        payload.id,
        day,
        url=payload.confirmation_url,
        text=payload.confirmation_text,
        reference=payload.reference,
        screenshot=payload.screenshot,
    )
    if payload.reference:
        parts.append(f"Reference: {payload.reference}.")
    if not kept:
        parts.append("No proof of submission kept.")
    event = JobEvent(
        date=day,
        status="Applied",
        note=" ".join(parts),
        link=payload.link or payload.confirmation_url or None,
        evidence=kept or None,
    )
    opp = store.log_event(payload.id, event)
    if payload.method and payload.method != opp.method:
        opp = store.update_listing(payload.id, {"method": payload.method})
    salary = pay_link.record_ask(opp.salary.model_dump(exclude_none=True) if opp.salary else None, payload.salary_quoted)
    if salary:
        opp = store.update_listing(payload.id, {"salary": salary})
    return view.summary(opp)
