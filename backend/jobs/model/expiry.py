"""A job's closing date is optional (the listing's deadline, only when it gives
one). Once it has passed, a job Ed never applied to moves to Expired on its own.
The event's source names the date, so a job Ed reopens on purpose stays open
until its closing date changes."""

from jobs.model import store
from jobs.model.schema import JobEvent, Opportunity

# Only jobs not applied to yet can expire; after applying, the company decides
OPEN_STATUSES = ("Shortlisted", "Ready")


def is_closed(opp: Opportunity, today: str) -> bool:
    return opp.application.status in OPEN_STATUSES and bool(opp.deadline) and opp.deadline < today


def expire_if_closed(opp: Opportunity) -> Opportunity:
    today = store.today()
    if not is_closed(opp, today):
        return opp
    event = JobEvent(
        date=today,
        status="Expired",
        note=f"The listing closed on {opp.deadline}.",
        source=f"deadline:{opp.deadline}",
    )
    return store.log_event(opp.id, event)
