"""What a job's timeline says about earlier applications."""

import re

from .schema import Opportunity

METHOD_LABEL = {"indeed": "Indeed", "linkedin": "LinkedIn", "company_site": "the company website", "other": ""}
_VIA = re.compile(r"\b(?:via|through|on) ([A-Za-z][\w .'-]{1,40}?)(?:[.;,(]|$)")


def applied_before(opp: Opportunity) -> dict | None:
    """The first time Ed applied: {date, via, status now}, or None."""
    event = next((e for e in opp.application.events if e.status == "Applied"), None)
    if event is None:
        return None
    match = _VIA.search(event.note)
    via = match.group(1).strip() if match else (opp.platform or METHOD_LABEL.get(opp.method, ""))
    return {"date": event.date, "via": via, "status": opp.application.status}


def warning(applied: dict | None) -> str | None:
    if not applied:
        return None
    via = f" via {applied['via']}" if applied["via"] else ""
    return (
        f"Already applied on {applied['date']}{via} (status now {applied['status']}). "
        "Don't apply again unless Ed says so."
    )
