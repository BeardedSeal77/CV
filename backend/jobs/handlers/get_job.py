from jobs.handlers._inputs import JobRef
from jobs.model import pay_link, store, view


def get_job(payload: JobRef) -> dict:
    """One job with its description, cover letter (text and private notes), prep
    notes, full timeline, and its pay check: grades at the ask, minimum and
    maximum against Ed's current job, net pay, Blue Card, the city's targets.
    With status no_city, `missing` names the city file to add."""
    data = store.get_with_docs(payload.id)
    opp = data["opportunity"]
    return {**view.detail(opp, data["jd"], data["letter"], data["notes"]), "pay_check": pay_link.pay_check(opp)}
