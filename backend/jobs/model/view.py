"""The shape the board and the MCP tools receive (same keys as lib/jobhunt/view.ts).
The dates the board shows are derived from the timeline, so they can never
disagree with it."""

from .letter import split_letter
from .schema import COLUMN_OF, STATUS_GROUP, Opportunity
from .store import letter_path


def _events(opp: Opportunity) -> list[dict]:
    # sorted() is stable, so same-day events keep the order they were logged in
    return [e.model_dump(exclude_none=True) for e in sorted(opp.application.events, key=lambda e: e.date)]


def _dates(opp: Opportunity) -> dict:
    events = _events(opp)
    current = opp.application.status
    # The event that set the current status, when the job ended up accepted or declined
    outcome = None
    if COLUMN_OF[current] in ("accepted", "declined"):
        outcome = next((e for e in reversed(events) if e.get("status") == current), None)
    return {
        "listed": opp.posted,
        "added": opp.added,
        "applied": next((e["date"] for e in events if e.get("status") == "Applied"), ""),
        "interviews": [
            {"date": e["date"], "status": e["status"], "note": e.get("note", "")}
            for e in events
            if e.get("status") in ("Screening", "Interview")
        ],
        "outcome": {"date": outcome["date"], "status": current} if outcome else None,
        "deadline": opp.deadline,
        "updated": opp.application.updated,
    }


def summary(opp: Opportunity) -> dict:
    status = opp.application.status
    return {
        "id": opp.id,
        "company": opp.company,
        "role": opp.role,
        "column": COLUMN_OF[status],
        "status": status,
        "country": opp.country,
        "city": opp.city,
        "city_id": opp.city_id,
        "pay": opp.pay,
        "salary": opp.salary.model_dump(exclude_none=True) if opp.salary else None,
        "hours": opp.hours,
        "mode": opp.mode,
        "method": opp.method,
        "platform": opp.platform,
        "website": opp.website,
        "url": opp.url,
        "email": opp.email,
        "fit": opp.fit,
        "interest": opp.interest,
        "size": opp.size,
        "what": opp.what,
        "hasLetter": letter_path(opp.id).is_file(),
        "dates": _dates(opp),
    }


def detail(opp: Opportunity, jd: str, letter: str, notes: str) -> dict:
    parts = split_letter(letter)
    return {
        **summary(opp),
        "hasLetter": bool(parts["text"]),
        "description": jd,
        "letter": parts,
        "notes": notes,
        "events": _events(opp),
    }


def stats(opps: list[Opportunity]) -> dict:
    applied = [o for o in opps if any(e.status == "Applied" for e in o.application.events)]
    heard_back = [o for o in applied if o.application.status != "Applied"]
    return {
        "total": len(opps),
        "applied": len(applied),
        "active": sum(STATUS_GROUP[o.application.status] == "active" for o in opps),
        "rejected": sum(o.application.status == "Rejected" for o in opps),
        "heardBackRate": round(len(heard_back) / len(applied) * 100) if applied else None,
        "lettersReady": sum(o.application.status == "Ready" for o in opps),
        "companies": len({o.company for o in opps}),
        "byColumn": {c: sum(COLUMN_OF[o.application.status] == c for o in opps) for c in COLUMN_OF.values()},
    }
