from jobs.handlers._inputs import JobRef
from jobs.model import store
from jobs.model.letter import split_letter


def get_letter(payload: JobRef) -> dict:
    """A job's cover letter: text (what gets printed) and notes (private prep
    notes kept above the --- line)."""
    store.read(payload.id)
    return split_letter(store.read_doc(payload.id, "letter"))
