from pydantic import BaseModel, ConfigDict, Field

from pay.handlers.get_baseline import get_baseline
from pay.handlers._inputs import NoInput
from pay.model import store
from pay.model.schema import Baseline


class UpdateBaseline(BaseModel):
    model_config = ConfigDict(extra="forbid")

    employer: str | None = None
    role: str | None = None
    started: str | None = Field(None, description="YYYY-MM")
    country: str | None = None
    city: str | None = Field(None, description="The home city's slug")
    currency: str | None = None
    gross_monthly: float | None = Field(None, gt=0)
    housing: float | None = Field(None, ge=0, description="Monthly housing cost today")
    everyday: float | None = Field(None, ge=0, description="Monthly groceries, coffee, fuel")
    fixed: float | None = Field(None, ge=0, description="Monthly pension, medical aid, insurance, car, debt")
    notes: str | None = None


def update_baseline(payload: UpdateBaseline) -> dict:
    """Change Ed's current job, gross pay or monthly costs; only the fields
    you pass change. Every grade is measured against this."""
    current = store.baseline().model_dump()
    changes = payload.model_dump(exclude_none=True)
    costs = {k: changes.pop(k) for k in ("housing", "everyday", "fixed") if k in changes}
    merged = {**current, **changes, "costs_monthly": {**current["costs_monthly"], **costs}}
    store.save_baseline(Baseline.model_validate(merged))
    return get_baseline(NoInput())
