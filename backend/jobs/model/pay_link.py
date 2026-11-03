"""The job hunt's view of the pay service: which city file a job's city is,
and the pay check for its salary. The pay service is reached through its
actions, never imported."""

from jobs.model.profile import read_profile
from jobs.model.salary import parse_pay
from jobs.model.schema import Opportunity
from utils.errors import ActionError
from utils.pipeline import dispatch


def resolve_city(text: str) -> dict:
    """{city_id, note}: empty when the text names no known city."""
    if not (text or "").strip():
        return {"city_id": "", "note": ""}
    try:
        return dispatch("pay.cities.resolve", {"text": text})
    except ActionError as err:
        return {"city_id": "", "note": str(err)}


def derive(changes: dict, current: dict | None = None) -> tuple[dict, str]:
    """Fill city_id from city and salary from pay when the caller set only the
    text. A salary read from new pay text keeps the ask already recorded.
    Returns the changes and a note about the city match, if any."""
    out = dict(changes)
    note = ""
    if out.get("city") is not None and "city_id" not in changes:
        match = resolve_city(out["city"])
        out["city_id"], note = match["city_id"], match["note"]
    if out.get("pay") is not None and "salary" not in changes:
        parsed = parse_pay(out["pay"])
        previous = (current or {}).get("salary") or {}
        if parsed:
            if previous.get("ask") and "ask" not in parsed and previous.get("currency") == parsed["currency"]:
                parsed["ask"] = previous["ask"]
            out["salary"] = parsed
    return out, note


def record_ask(salary: dict | None, quoted: str) -> dict | None:
    """The salary with the ask Ed entered on an application form, when the
    text gives an amount."""
    parsed = parse_pay(quoted)
    figure = parsed and (parsed.get("ask") or parsed.get("min") or parsed.get("max"))
    if not figure:
        return None
    base = dict(salary or {"currency": parsed["currency"]})
    if base.get("currency") != parsed["currency"]:
        return None
    return {**base, "ask": figure}


def profile_asks() -> dict:
    """Ed's salary expectations by country code, from profile.md."""
    try:
        expectations = read_profile().get("salary_expectations") or {}
    except FileNotFoundError:
        return {}
    return {code: parse_pay(text) for code, text in expectations.items() if text and parse_pay(text)}


def _usual_ask(opp: Opportunity, asks: dict) -> tuple[dict | None, str]:
    """Ed's default expectation for the job's country, capped at the listing's
    maximum: an upside to see, not something the company agreed to."""
    expected = asks.get(opp.country) or asks.get("default")
    if not expected:
        return None, ""
    amount = expected.get("ask") or expected.get("min")
    currency = expected["currency"]
    note = f"your usual ask ({currency} {amount:,.0f}"
    salary = opp.salary
    if salary and salary.currency == currency and salary.max is not None and salary.max < amount:
        amount = salary.max
        note += ", capped at the listing's maximum"
    return {"currency": currency, "ask": amount}, note + ")"


def pay_check(opp: Opportunity, asks: dict | None = None) -> dict:
    """The full pay check for a job, computed now. The headline is the salary
    Ed recorded for this job, else the listing's minimum."""
    if not (opp.city_id or opp.city).strip():
        return {"status": "no_city", "message": "The job has no city"}
    salary = opp.salary.model_dump(exclude_none=True) if opp.salary else None
    usual, note = _usual_ask(opp, profile_asks() if asks is None else asks)
    try:
        return dispatch(
            "pay.quote",
            {
                "city": opp.city_id or opp.city or "",
                "salary": salary,
                "ask_source": "recorded" if salary and salary.get("ask") else "",
                "usual_ask": usual,
                "usual_ask_note": note,
            },
        )
    except ActionError as err:
        return {"status": "no_city", "message": str(err)}


def compact(check: dict) -> dict:
    """The board card's part of a pay check."""
    out = {"headline_grade": check.get("headline_grade"), "status": check["status"]}
    if check["status"] == "no_city":
        out["message"] = check.get("message")
    return out
