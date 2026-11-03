from jobs.handlers._inputs import NoInput
from jobs.model import store, view
from jobs.model.expiry import expire_if_closed


def expire_closed_jobs(payload: NoInput) -> dict:
    """Move every job whose closing date (deadline) has passed, and that Ed
    never applied to, to Expired. The API runs this every hour; a job added or
    updated with a past closing date expires straight away. A job Ed reopens
    stays open until its closing date changes."""
    expired = []
    for opp in store.list_all():
        after = expire_if_closed(opp)
        if after.application.status != opp.application.status:
            expired.append(view.summary(after))
    return {"expired": expired}
