"""Gross to net, one pure function per country's rules: (monthly gross, the
country file's tax_params) -> monthly net in the same currency. Where net pay
changes during the year (Poland), the result is the average month over a full
year. Add a country by adding a function here and naming it in its file."""

from collections.abc import Callable


def _progressive(income: float, bands: list[list[float]]) -> float:
    """bands: [from, rate] pairs, lowest first; each rate applies above its
    `from` up to the next band's."""
    tax = 0.0
    for i, (start, rate) in enumerate(bands):
        end = bands[i + 1][0] if i + 1 < len(bands) else float("inf")
        if income > start:
            tax += (min(income, end) - start) * rate
    return tax


def za_2027(gross: float, p: dict) -> float:
    """SARS tax year 1 Mar 2026 - 28 Feb 2027: annual brackets as [from, base
    tax, rate] (the base tax is due at `from`), minus the primary rebate; UIF
    1% capped per month."""
    annual = gross * 12
    tax = 0.0
    for start, base, rate in reversed(p["brackets"]):
        if annual > start:
            tax = base + (annual - start) * rate
            break
    tax = max(0.0, tax - p["primary_rebate"])
    uif = min(gross * p["uif_rate"], p["uif_cap_monthly"])
    return gross - tax / 12 - uif


def lv_2026(gross: float, p: dict) -> float:
    """Social 10.5%; PIT 25.5% on (gross - social - non-taxable minimum) up to
    the annual threshold, 33% above."""
    social = gross * p["employee_social"]
    taxable = max(0.0, gross - social - p["non_taxable_monthly"])
    threshold = p["pit_threshold_annual"] / 12
    pit = min(taxable, threshold) * p["pit_low"] + max(0.0, taxable - threshold) * p["pit_high"]
    return gross - social - pit


def lt_2026(gross: float, p: dict) -> float:
    """Sodra (the health part uncapped, the social part capped per year); GPM
    by annual bands on gross minus NPD; optional Pillar II."""
    annual = gross * 12
    social_base = min(annual, p["social_cap_annual"])
    sodra = (social_base * (p["sodra_rate"] - p["health_rate"]) + annual * p["health_rate"]) / 12
    if p.get("pillar2"):
        sodra += gross * p["pillar2_rate"]
    npd = p["npd_max"] if gross <= p["npd_from"] else max(0.0, p["npd_max"] - p["npd_taper"] * (gross - p["npd_from"]))
    gpm = _progressive(max(0.0, gross - npd) * 12, p["gpm_bands"]) / 12
    return gross - sodra - gpm


def pl_2026_uop(gross: float, p: dict) -> float:
    """An employment contract (umowa o prace), simulated month by month: ZUS
    (pension and disability stop at the annual ceiling), health 9%, PIT
    advances at 12% then 32% past the threshold, less the monthly reduction
    every month. Returns the average month."""
    zus_capped_rate = p["pension"] + p["disability"]
    paid_into_zus = 0.0
    cumulative_base = 0.0
    total = 0.0
    for _ in range(12):
        capped = max(0.0, min(gross, p["zus_ceiling_annual"] - paid_into_zus))
        paid_into_zus += gross
        zus = round(capped * zus_capped_rate, 2) + round(gross * p["sickness"], 2)
        health = round((gross - zus) * p["health"], 2)
        ppk = round(gross * p["ppk_employee"], 2) if p.get("ppk") else 0.0
        employer_ppk = gross * p["ppk_employer"] if p.get("ppk") else 0.0
        base = round(gross + employer_ppk - zus - p["kup_monthly"])
        low = max(0.0, min(base, p["pit_threshold_annual"] - cumulative_base))
        cumulative_base += base
        pit = max(0, round(low * p["pit_low"] + (base - low) * p["pit_high"] - p["reduction_monthly"]))
        total += gross - zus - health - pit - ppk
    return total / 12


MODELS: dict[str, Callable[[float, dict], float]] = {
    "za_2027": za_2027,
    "lv_2026": lv_2026,
    "lt_2026": lt_2026,
    "pl_2026_uop": pl_2026_uop,
}


def net_monthly(model: str, gross: float, params: dict) -> float:
    if model not in MODELS:
        raise KeyError(f"No tax model {model}")
    return MODELS[model](gross, params) if gross > 0 else 0.0
