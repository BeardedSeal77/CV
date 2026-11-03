from jobs.model import store


def resolve_application_status(payload) -> str | None:
    """The job's current status, for the process guard; None when it doesn't exist."""
    return store.read(payload.id).application.status if store.exists(payload.id) else None
