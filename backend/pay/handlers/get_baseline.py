from pay.handlers._inputs import NoInput
from pay.model import grade, store


def get_baseline(payload: NoInput) -> dict:
    """Ed's current job, pay and monthly costs, with the computed net pay, how
    many times over his everyday costs are covered after housing (cover), and
    the grade thresholds every job is measured against."""
    base = store.baseline()
    h = grade.home()
    return {
        "baseline": base.model_dump(),
        "net_monthly": round(h.net, 2),
        "cover": round(h.cover, 2),
        "home_city": {"slug": h.city.slug, "name": h.city.name, "col_index": h.col_index},
        "grades": [g.model_dump() for g in h.grading.grades],
        "rent_share_penalty": h.grading.rent_share_penalty.model_dump(),
    }
