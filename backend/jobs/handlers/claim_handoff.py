from pydantic import BaseModel, ConfigDict

from jobs.model import handoff, store
from jobs.model.schema import JobEvent


class ClaimHandoff(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str
    origin: str = ""  # the page's Origin header; empty never matches a ticket


def claim_handoff(payload: ClaimHandoff) -> dict:
    """Used by GET /handoff/<token> only: checks the ticket against the
    requesting page's origin, ends it, and logs the hand-off on the job's
    timeline. Returns the PDF's path for the route to send."""
    claimed = handoff.claim(payload.token, payload.origin)
    store.log_event(
        claimed["job_id"],
        JobEvent(
            date=store.today(),
            note=f"Handed {claimed['name']} to {claimed['origin']}.",
            source=f"handoff:{payload.token[:16]}",
        ),
    )
    return claimed
