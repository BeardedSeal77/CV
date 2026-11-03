from pydantic import BaseModel, ConfigDict, Field

from pay.model import store


class CountryRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(description="Two-letter code, e.g. PL")


def get_country(payload: CountryRef) -> dict:
    """A country's tax model and parameters, average wage, Blue Card minimums
    and contract rule, each with its source and date."""
    return store.country(payload.code.upper()).model_dump()
