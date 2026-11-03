from pydantic import BaseModel, ConfigDict, Field, model_validator

from pay.model import grade, store
from pay.model.cities import resolve
from pay.model.schema import Salary


class Quote(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str = Field(description="A city slug or the city as a listing writes it")
    gross: float | None = Field(None, gt=0, description="Monthly gross in the city's currency")
    salary: Salary | None = Field(None, description="Or a full salary: currency, min, max, ask, period, basis")
    ask_source: str = Field("", description="Where the ask came from, shown with its grade")
    usual_ask: Salary | None = Field(
        None, description="Ed's default expectation (its ask), graded alongside; never the headline"
    )
    usual_ask_note: str = Field("", description="How the usual ask was set, e.g. capped at the listing's maximum")

    @model_validator(mode="after")
    def _one(self):
        if self.gross and self.salary:
            raise ValueError("Pass gross or salary, not both")
        return self


def get_quote(payload: Quote) -> dict:
    """Grade any pay in any city, no job needed: the pay check with the grade
    at the ask (the headline when given, else the minimum), minimum, maximum
    and Ed's usual ask, net pay (also in rand), cover against
    today, rent share, local standing, the Blue Card check, the city's targets
    and any stale figures. status is ok, no_city (names the missing city
    file), no_salary or stale_data."""
    salary = payload.salary
    if payload.gross:
        slug = payload.city if store.city_exists(payload.city) else resolve(payload.city)["city_id"]
        currency = store.country(store.city(slug).country).currency if slug else "EUR"
        salary = Salary(currency=currency, ask=payload.gross)
    return grade.quote(
        payload.city,
        salary,
        ask_source=payload.ask_source,
        usual_ask=payload.usual_ask,
        usual_ask_note=payload.usual_ask_note,
    )
