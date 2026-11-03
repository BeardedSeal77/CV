"""Grading pay against Ed's current job. All amounts are monthly, in the city's
currency unless noted.

  net          the country's tax model applied to the gross
  everyday     Ed's own everyday spending, scaled by the cities' cost-of-living
               indexes and converted to the city's currency
  cover        (net - housing - fixed) / everyday: how many times over the
               money left after housing pays for everyday life
  vs_baseline  cover / today's cover
  grade        the best grade whose threshold vs_baseline reaches, one lower
               when housing takes more than the rent-share limit of net pay
"""

from dataclasses import dataclass
from datetime import date

from utils.errors import NotFound

from . import store
from .cities import guess_slug, resolve
from .schema import City, Country, Fx, Grading, Salary
from .tax import net_monthly

HOURS_PER_MONTH = 168  # a full-time month, for hourly rates
GROSS_CEILING = 10_000_000  # the bisection's upper bound in any currency


@dataclass(frozen=True)
class Home:
    grading: Grading
    fx: Fx
    currency: str
    col_index: float
    housing: float
    everyday: float
    fixed: float
    net: float
    cover: float
    city: City
    country: Country


@dataclass(frozen=True)
class Place:
    city: City
    country: Country
    everyday: float
    housing: float
    fixed: float


def home() -> Home:
    base = store.baseline()
    city = store.city(base.city)
    country = store.country(base.country)
    costs = base.costs_monthly
    net = net_monthly(country.tax_model, base.gross_monthly, country.tax_params)
    return Home(
        grading=store.grading(),
        fx=store.fx(),
        currency=base.currency,
        col_index=city.numbeo.col_index,
        housing=costs.housing,
        everyday=costs.everyday,
        fixed=costs.fixed,
        net=net,
        cover=(net - costs.housing - costs.fixed) / costs.everyday,
        city=city,
        country=country,
    )


def convert(amount: float, from_currency: str, to_currency: str, fx: Fx) -> float:
    """Through the base currency (rand); refuses a currency with no rate."""
    if from_currency == to_currency:
        return amount

    def in_base(currency: str) -> float:
        if currency == fx.base:
            return 1.0
        if currency not in fx.rates:
            raise NotFound(f"No exchange rate for {currency}: set it with pay.fx.update")
        return fx.rates[currency].rate

    return amount * in_base(from_currency) / in_base(to_currency)


def place(h: Home, city: City) -> Place:
    country = store.country(city.country)
    is_home = city.slug == h.city.slug
    everyday = convert(h.everyday * city.numbeo.col_index / h.col_index, h.currency, country.currency, h.fx)
    if is_home:
        housing = h.housing
    elif city.housing:
        housing = city.housing.planning_monthly
    else:
        raise NotFound(f"No housing figure for {city.slug}: add housing to its city file")
    fixed = city.fixed_monthly if city.fixed_monthly is not None else (h.fixed if is_home else 0.0)
    return Place(city=city, country=country, everyday=everyday, housing=housing, fixed=fixed)


def _net(p: Place, gross: float) -> float:
    return net_monthly(p.country.tax_model, gross, p.country.tax_params)


def _vs(h: Home, p: Place, gross: float) -> float:
    return (_net(p, gross) - p.housing - p.fixed) / p.everyday / h.cover


def grade_of(g: Grading, vs: float, rent_share: float) -> str:
    grades = g.grades  # best first
    index = next((i for i, gr in enumerate(grades) if vs >= gr.min_vs_baseline), len(grades) - 1)
    if rent_share > g.rent_share_penalty.above:
        index = min(len(grades) - 1, index + g.rent_share_penalty.drop_grades)
    return grades[index].grade


def evaluate(h: Home, p: Place, gross: float) -> dict:
    net = _net(p, gross)
    cover = (net - p.housing - p.fixed) / p.everyday
    vs = cover / h.cover
    rent_share = p.housing / net if net > 0 else 1.0
    return {
        "gross": round(gross),
        "net": round(net),
        "cover": round(cover, 2),
        "vs_baseline": round(vs, 2),
        "rent_share": round(rent_share, 2),
        "grade": grade_of(h.grading, vs, rent_share),
    }


def _solve(f, target: float) -> float:
    """The smallest gross where the increasing function f reaches target."""
    lo, hi = 0.0, float(GROSS_CEILING)
    if f(hi) < target:
        return float("nan")
    for _ in range(80):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if f(mid) < target else (lo, mid)
        if hi - lo < 0.5:
            break
    return hi


def _round10(gross: float) -> int | None:
    return None if gross != gross else int(round(gross, -1))  # NaN: out of reach


def targets(h: Home, p: Place) -> dict:
    """The gross that reaches each grade's threshold, and the gross where
    housing drops to the rent-share limit, rounded to the nearest 10."""
    out = {}
    for gr in reversed(h.grading.grades):
        if gr.min_vs_baseline > 0:
            out[gr.grade] = _round10(_solve(lambda g: _vs(h, p, g), gr.min_vs_baseline))
    limit = h.grading.rent_share_penalty.above
    out["rent_share_limit"] = _round10(_solve(lambda g: _net(p, g), p.housing / limit))
    return out


def gross_from_net(p: Place, net: float) -> float:
    return _solve(lambda g: _net(p, g), net)


def blue_card(country: Country, gross: float | None) -> dict:
    cards = country.blue_card
    if not cards:
        return {"clears": None, "minimum": None, "next_minimum": None, "warning": None, "other": [], "contract_rule": country.contract_rule}
    standard = next((c for c in cards if c.kind == "standard"), cards[0])
    nxt = country.blue_card_next
    warnings = []
    clears = None if gross is None else gross >= standard.min_gross_monthly
    if clears is False:
        warnings.append(f"Below the Blue Card minimum of {standard.min_gross_monthly:,.2f} {country.currency}.")
    if gross is not None and nxt and gross < nxt.min_gross_monthly:
        span = f"{nxt.min_gross_monthly:,.0f}" + (f"-{nxt.max_gross_monthly:,.0f}" if nxt.max_gross_monthly else "")
        when = f" from {nxt.starts}" if nxt.starts else ""
        warnings.append(f"Below the {'expected ' if nxt.estimate else ''}minimum{when} (about {country.currency} {span}).")
    return {
        "clears": clears,
        "minimum": standard.min_gross_monthly,
        "next_minimum": nxt.min_gross_monthly if nxt else None,
        "warning": " ".join(warnings) or None,
        "other": [
            {"kind": c.kind, "minimum": c.min_gross_monthly, "clears": None if gross is None else gross >= c.min_gross_monthly}
            for c in cards
            if c is not standard
        ],
        "contract_rule": country.contract_rule,
    }


def _age(as_of: str | None, today: date) -> int:
    return (today - date.fromisoformat(as_of)).days if as_of else 0


def _is_stale(as_of: str | None, next_release: str | None, limit: int, today: date) -> bool:
    """A scheduled figure is stale once its next release is due; any other
    once it is older than the limit."""
    if not as_of:
        return False
    if next_release:
        return today > date.fromisoformat(next_release)
    return _age(as_of, today) > limit


def stale(h: Home, city: City, country: Country, today: date, *, with_wages: bool = False) -> list[str]:
    """Every figure the check uses that is due for a refresh. with_wages adds
    the city's wage figures, which the cities table shows but grading doesn't use."""
    limit = h.grading.stale_after_days
    dated = [
        (f"{city.slug} cost of living", city.numbeo.as_of, city.numbeo.next_release),
        (f"{h.city.slug} cost of living (home)", h.city.numbeo.as_of, h.city.numbeo.next_release),
        (f"{country.code} tax rules", country.tax_as_of, None),
        (f"{country.code} average wage", country.avg_gross_as_of, country.avg_gross_next_release),
        *((f"{country.code} Blue Card ({c.kind})", c.as_of, c.next_release) for c in country.blue_card),
    ]
    if city.housing:
        dated.append((f"{city.slug} housing", city.housing.as_of, city.housing.next_release))
    if with_wages and city.wages:
        dated.append((f"{city.slug} wages", city.wages.as_of, city.wages.next_release))
    out = [
        f"{what} ({as_of}{f', next release {nxt}' if nxt else ''})"
        for what, as_of, nxt in dated
        if _is_stale(as_of, nxt, limit, today)
    ]
    for currency in {country.currency, h.currency} - {h.fx.base}:
        rate = h.fx.rates.get(currency)
        if rate and _age(rate.as_of, today) > h.grading.fx_stale_after_days:
            out.append(f"{currency} exchange rate ({rate.as_of})")
    return out


def _monthly(p: Place, amount: float, salary: Salary, fx: Fx) -> float:
    amount = convert(amount, salary.currency, p.country.currency, fx)
    if salary.period == "year":
        amount /= 12
    elif salary.period == "hour":
        amount *= HOURS_PER_MONTH
    return gross_from_net(p, amount) if salary.basis == "net" else amount


def city_targets(slug: str) -> dict:
    h = home()
    p = place(h, store.city(slug))
    return {
        "city": slug,
        "name": p.city.name,
        "country": p.country.code,
        "currency": p.country.currency,
        "housing": round(p.housing),
        "everyday": round(p.everyday),
        "targets": targets(h, p),
        "blue_card": blue_card(p.country, None),
        "stale": stale(h, p.city, p.country, date.today(), with_wages=True),
    }


def quote(city_text: str, salary: Salary | None, *, ask_source: str = "", usual_ask: Salary | None = None,
          usual_ask_note: str = "") -> dict:
    """The pay check for a salary in a city: grades at the ask, minimum and
    maximum, net pay, Blue Card, the city's targets and stale figures. The
    headline is the ask, else the minimum, else the maximum. A usual ask (Ed's
    default expectation) is graded alongside but never becomes the headline."""
    today = date.today()
    match = resolve(city_text) if not store.city_exists(city_text) else {"city_id": city_text, "note": ""}
    slug = match["city_id"]
    if not slug:
        missing = guess_slug(city_text)
        return {
            "status": "no_city",
            "city": missing or None,
            "missing": f"data/jobhunt/pay/cities/{missing}.json" if missing else None,
            "message": f"Add city data for {city_text}" if city_text else "The job has no city",
            "as_of": today.isoformat(),
        }

    h = home()
    p = place(h, store.city(slug))
    figures = {}
    if salary:
        for key in ("ask", "min", "max"):
            amount = getattr(salary, key)
            if amount:
                figures[key] = _monthly(p, amount, salary, h.fx)
    grades = {key: evaluate(h, p, gross) for key, gross in figures.items()}
    if ask_source and "ask" in grades:
        grades["ask"]["source"] = ask_source
    if usual_ask and usual_ask.ask:
        grades["usual_ask"] = {**evaluate(h, p, _monthly(p, usual_ask.ask, usual_ask, h.fx)), "source": usual_ask_note}
    headline_key = next((k for k in ("ask", "min", "max") if k in grades), None)
    headline = grades.get(headline_key) if headline_key else None
    stale_figures = stale(h, p.city, p.country, today)
    avg = p.country.avg_gross_monthly

    if not headline:
        status = "no_salary"
    else:
        status = "stale_data" if stale_figures else "ok"
    return {
        "status": status,
        "city": slug,
        "city_note": match["note"] or None,
        "currency": p.country.currency,
        "grades": grades,
        "headline_grade": headline["grade"] if headline else None,
        "headline": headline_key,
        "net_zar": round(convert(headline["net"], p.country.currency, h.fx.base, h.fx)) if headline else None,
        "local_standing": round(headline["gross"] / avg, 2) if headline and avg else None,
        "blue_card": blue_card(p.country, headline["gross"] if headline else None),
        "targets": targets(h, p),
        "stale": stale_figures,
        "as_of": today.isoformat(),
    }
