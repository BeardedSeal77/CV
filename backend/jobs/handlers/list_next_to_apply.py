from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view
from jobs.model.letter import split_letter

# Only good fits go in the queue: mass applications to poor fits hurt more than they help
QUEUE_FITS = ("strong", "good")
_FIT_ORDER = {"strong": 0, "good": 1}
# Low interest roles wait until Ed raises them
_INTEREST_ORDER = {"High": 0, "Medium": 1}


class NextToApply(BaseModel):
    model_config = ConfigDict(extra="forbid")

    limit: int = Field(10, ge=1, le=100)


def list_next_to_apply(payload: NextToApply) -> dict:
    """The apply queue: Backlog jobs with a Strong or Good fit and High or
    Medium interest; High interest first, then the soonest deadline, the
    strongest fit and the oldest. "ready" have a cover letter
    and can be applied to (jobs.application_packet); "needs_letter" need one
    drafted first (jobs.letter_brief, then jobs.set_letter). Stretch fits and
    Low interest stay out unless Ed changes them."""
    queue = [
        o
        for o in store.list_all()
        if o.application.status in ("Shortlisted", "Ready")
        and o.fit.strip().lower() in QUEUE_FITS
        and o.interest in _INTEREST_ORDER
    ]
    queue.sort(
        key=lambda o: (
            _INTEREST_ORDER[o.interest],
            o.deadline or "9999-12-31",
            _FIT_ORDER[o.fit.strip().lower()],
            o.added,
        )
    )

    ready, needs_letter = [], []
    for opp in queue:
        has_letter = bool(split_letter(store.read_doc(opp.id, "letter"))["text"])
        (ready if has_letter else needs_letter).append(view.summary(opp))
    return {"ready": ready[: payload.limit], "needs_letter": needs_letter[: payload.limit]}
