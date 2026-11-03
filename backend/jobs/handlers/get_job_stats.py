from jobs.handlers._inputs import NoInput
from jobs.model import store, view


def get_job_stats(payload: NoInput) -> dict:
    """Summary numbers: applied, active, rejected, heard-back rate, letters
    ready, companies, and jobs per column."""
    return view.stats(store.list_all())
