from pydantic import BaseModel, ConfigDict, Field

from pay.model import store
from pay.model.schema import City


class UpsertCity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(description="Lowercase, no accents, e.g. krakow")
    name: str | None = None
    country: str | None = Field(None, description="Two-letter code; its countries/<CC>.json must exist")
    aliases: list[str] | None = None
    numbeo: dict | None = Field(None, description="col_index (required), rent_index, ... plus as_of and source")
    housing: dict | None = Field(None, description="planning_monthly, breakdown, market_range, as_of, source")
    fixed_monthly: float | None = Field(None, ge=0, description="Fixed costs here, e.g. private health insurance")
    wages: dict | None = Field(None, description="city_avg_gross, as_of, source")
    prices: dict[str, float] | None = None
    notes: str | None = None


def update_city(payload: UpsertCity) -> dict:
    """Add a city, or refresh some of its figures: each block you pass
    (numbeo, housing, wages) replaces the fields it names and must carry its
    own as_of and source. Validated against the city schema."""
    changes = payload.model_dump(exclude_none=True)
    current = store.city(payload.slug).model_dump() if store.city_exists(payload.slug) else {}
    merged = {**current}
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(current.get(key), dict) and key != "prices":
            merged[key] = {**current[key], **value}
        else:
            merged[key] = value
    city = City.model_validate(merged)
    store.country(city.country)  # the country file must exist first
    store.save_city(city)
    return {"saved": city.slug, "created": not current, "city": city.model_dump()}
