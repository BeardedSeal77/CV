from pydantic import BaseModel, ConfigDict, Field

from pay.model import store, tax
from pay.model.schema import Country
from utils.errors import ActionError, NotFound


class UpsertCountry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(description="Two-letter code, e.g. PL")
    name: str | None = None
    currency: str | None = None
    tax_model: str | None = Field(None, description="One of the built-in models, e.g. pl_2026_uop")
    tax_params: dict | None = Field(None, description="Merged into the current parameters")
    tax_source: str | None = None
    tax_as_of: str | None = None
    avg_gross_monthly: float | None = None
    avg_gross_as_of: str | None = None
    avg_gross_source: str | None = None
    avg_gross_next_release: str | None = Field(
        None, description="When the average is next published (YYYY-MM-DD); until then it is not stale"
    )
    blue_card: list[dict] | None = Field(
        None, description="Replaces the list: kind, min_gross_monthly, basis, official, as_of, source, next_release"
    )
    blue_card_next: dict | None = None
    contract_rule: str | None = None


def update_country(payload: UpsertCountry) -> dict:
    """Add a country or refresh its figures; only the fields you pass change
    (tax_params are merged; null clears a field). Validated, and the tax
    model must exist."""
    code = payload.code.upper()
    # Only the fields passed change; an explicit null clears one
    changes = payload.model_dump(exclude_unset=True, exclude={"code"})
    try:
        current = store.country(code).model_dump()
    except NotFound:
        current = {}
    if changes.get("tax_params") is not None:
        changes["tax_params"] = {**current.get("tax_params", {}), **changes["tax_params"]}
    country = Country.model_validate({**current, **changes, "code": code})
    if country.tax_model not in tax.MODELS:
        raise ActionError(f"No tax model {country.tax_model}. Built in: {', '.join(tax.MODELS)}")
    store.save_country(country)
    return {"saved": code, "created": not current, "country": country.model_dump()}
