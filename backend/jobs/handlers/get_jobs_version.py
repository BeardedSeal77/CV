from jobs.handlers._inputs import NoInput
from jobs.model import store


def get_jobs_version(payload: NoInput) -> dict:
    """A fingerprint of every job file; poll it and refetch when it changes."""
    return {"version": store.version()}
