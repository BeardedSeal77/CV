import os

from jobs.model import store


def on_job_changed(event: str, result: dict) -> None:
    """With CV_AUTOCOMMIT=1, commits the changed job's folder to the data repo."""
    if os.environ.get("CV_AUTOCOMMIT") != "1" or not result.get("id"):
        return
    detail = f" -> {result['status']}" if event == "job.moved" and result.get("status") else ""
    store.autocommit(f"jobs: {result['id']} {event.split('.', 1)[1]}{detail}", result["id"])
