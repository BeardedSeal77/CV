from jobs.handlers._inputs import JobRef
from jobs.model import store
from jobs.model.letter import letter_date, split_letter


def get_letter(payload: JobRef) -> dict:
    """A job's cover letter: text (what gets printed), notes (private prep
    notes kept above the --- line) and date (printed on it: the job's fixed
    letter_date, else today)."""
    opp = store.read(payload.id)
    return {**split_letter(store.read_doc(payload.id, "letter")), "date": letter_date(opp.letter_date)}
