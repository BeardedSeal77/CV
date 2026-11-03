"""Runs an action on a timer inside the API process, for work no request
starts (a listing passing its closing date). Each run goes through the same
pipeline as POST /api/actions/<name>."""

import logging
import threading

from utils.pipeline import dispatch

log = logging.getLogger(__name__)


def every(seconds: int, action: str, payload: dict | None = None) -> None:
    """Run the action now, then every `seconds`, on a daemon thread."""
    wake = threading.Event()

    def run() -> None:
        while True:
            try:
                dispatch(action, payload or {})
            except Exception:
                log.exception("Timed action %s failed", action)
            wake.wait(seconds)

    threading.Thread(target=run, name=f"timer {action}", daemon=True).start()
