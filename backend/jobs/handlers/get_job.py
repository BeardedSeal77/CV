from jobs.handlers._inputs import JobRef
from jobs.model import store, view


def get_job(payload: JobRef) -> dict:
    """One job with its description, cover letter (text and private notes), prep
    notes and full timeline."""
    data = store.get_with_docs(payload.id)
    return view.detail(data["opportunity"], data["jd"], data["letter"], data["notes"])
