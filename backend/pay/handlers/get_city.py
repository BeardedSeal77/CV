from pay.handlers._inputs import CityRef
from pay.model import grade, store
from pay.model.cities import resolve
from utils.errors import NotFound


def get_city(payload: CityRef) -> dict:
    """One city with every figure, its source and date, plus its country's tax
    and Blue Card rules and the gross needed for each grade."""
    slug = payload.city if store.city_exists(payload.city) else resolve(payload.city)["city_id"]
    if not slug:
        raise NotFound(f"No city file for {payload.city}: add it with pay.cities.upsert")
    city = store.city(slug)
    country = store.country(city.country)
    # The targets' short city and country keys give way to the full records
    return {
        **grade.city_targets(slug),
        "city": city.model_dump(),
        "country": country.model_dump(),
    }
