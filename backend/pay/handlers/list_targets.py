from pydantic import BaseModel, ConfigDict, Field

from pay.model import grade, store
from pay.model.cities import resolve
from utils.errors import NotFound


class Targets(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str | None = Field(None, description="One city, or leave out for all")


def list_targets(payload: Targets) -> dict:
    """The monthly gross needed for each grade, per city, with the gross where
    housing drops to the rent-share limit and the Blue Card minimum alongside,
    plus the inputs they rest on (baseline net, housing, everyday and fixed
    costs, the cost-of-living indexes and the exchange rate with its date)."""
    if payload.city:
        slug = payload.city if store.city_exists(payload.city) else resolve(payload.city)["city_id"]
        if not slug:
            raise NotFound(f"No city file for {payload.city}")
        slugs = [slug]
    else:
        slugs = [c.slug for c in store.all_cities()]
    return {"targets": [grade.city_targets(s) for s in slugs]}
