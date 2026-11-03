from pydantic import BaseModel, ConfigDict, Field

from pay.model import store
from pay.model.schema import Fx, Rate


class UpdateFx(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str = Field(description="e.g. EUR")
    rate: float = Field(gt=0, description="Rand per one unit of the currency")
    as_of: str = Field(description="YYYY-MM-DD")
    source: str = ""


def update_fx(payload: UpdateFx) -> dict:
    """Set an exchange rate to the rand, with its date and source."""
    fx = store.fx()
    rates = {**fx.rates, payload.currency.upper(): Rate(rate=payload.rate, as_of=payload.as_of, source=payload.source)}
    updated = Fx(base=fx.base, rates=rates)
    store.save_fx(updated)
    return updated.model_dump()
