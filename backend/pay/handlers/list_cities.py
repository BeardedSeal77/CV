from datetime import date

from pay.handlers._inputs import NoInput
from pay.model import grade, store


def _oldest(city) -> str:
    """The oldest date among the city's figures and its country's."""
    country = store.country(city.country)
    dates = [city.numbeo.as_of, country.tax_as_of, country.avg_gross_as_of, *(b.as_of for b in country.blue_card)]
    dates += [b.as_of for b in (city.housing, city.wages) if b]
    return min(d for d in dates if d)


def list_cities(payload: NoInput) -> dict:
    """Every city with its headline cost-of-living and rent indexes, planning
    housing and everyday costs, the gross needed for each grade, the Blue Card
    minimum and how old its oldest figure is (stale_after_days is the limit;
    stale lists the old figures the grading itself uses)."""
    h = grade.home()
    today = date.today()
    rows = []
    for city in store.all_cities():
        row = {
            "slug": city.slug,
            "name": city.name,
            "country": city.country,
            "col_index": city.numbeo.col_index,
            "rent_index": city.numbeo.rent_index,
            "home": city.slug == h.city.slug,
            "oldest_as_of": _oldest(city),
            "age_days": (today - date.fromisoformat(_oldest(city))).days,
        }
        try:
            row.update(grade.city_targets(city.slug))
        except Exception as err:  # a city whose country or rate is missing still lists
            row["problem"] = str(err)
        rows.append(row)
    return {"cities": rows, "baseline_cover": round(h.cover, 2), "stale_after_days": h.grading.stale_after_days}
