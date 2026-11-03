"""The pay data: Ed's current job (the baseline), grading settings, exchange
rates, and one file per country and per city. Every figure from outside
carries its source and as_of date, so staleness can be computed."""

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CITY_SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
COUNTRY_CODE = re.compile(r"^[A-Z]{2}$")
CURRENCY = re.compile(r"^[A-Z]{3}$")


def _date(v: str | None) -> str | None:
    if v is None or v == "" or ISO_DATE.match(v):
        return v
    raise ValueError("Use YYYY-MM-DD")


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Sourced(Strict):
    """A block of figures from one source, read on one date. A figure published
    on a schedule names its next release: it is stale only once that date has
    passed, instead of after a fixed number of days."""

    as_of: str
    source: str = ""
    next_release: str | None = None

    @field_validator("as_of", "next_release")
    @classmethod
    def _as_of(cls, v: str | None) -> str | None:
        return _date(v)


# ---------------------------------------------------------------- baseline
class Costs(Strict):
    housing: float = Field(ge=0)
    everyday: float = Field(ge=0, description="Groceries, coffee, fuel: what scales with the cost of living")
    fixed: float = Field(0, ge=0, description="Pension, medical aid, insurance, car, debt")


class Baseline(Strict):
    employer: str
    role: str
    started: str = ""
    country: str
    city: str = Field(description="The home city's slug; its cost-of-living index is the yardstick")
    currency: str
    gross_monthly: float = Field(gt=0)
    costs_monthly: Costs
    notes: str = ""


# ---------------------------------------------------------------- grading
class Grade(Strict):
    grade: str
    min_vs_baseline: float = Field(ge=0)
    label: str = ""


class RentPenalty(Strict):
    above: float = Field(gt=0, lt=1)
    drop_grades: int = Field(1, ge=0)


class Grading(Strict):
    grades: list[Grade] = Field(min_length=1)
    rent_share_penalty: RentPenalty
    stale_after_days: int = Field(183, gt=0)
    fx_stale_after_days: int = Field(30, gt=0)

    @field_validator("grades")
    @classmethod
    def _best_first(cls, v: list[Grade]) -> list[Grade]:
        return sorted(v, key=lambda g: g.min_vs_baseline, reverse=True)


# ---------------------------------------------------------------- fx
class Rate(Sourced):
    rate: float = Field(gt=0, description="Units of the base currency per one unit of this one")


class Fx(Strict):
    base: str
    rates: dict[str, Rate] = Field(default_factory=dict)


# ---------------------------------------------------------------- countries
class BlueCard(Strict):
    kind: str
    min_gross_monthly: float = Field(gt=0)
    basis: str = ""
    official: bool = True
    as_of: str
    source: str = ""
    next_release: str | None = Field(None, description="When the figure it is built on is next published")

    @field_validator("as_of", "next_release")
    @classmethod
    def _as_of(cls, v: str | None) -> str | None:
        return _date(v)


class BlueCardNext(Strict):
    """A known or estimated future minimum, e.g. Poland's from February 2027."""

    min_gross_monthly: float = Field(gt=0)
    max_gross_monthly: float | None = Field(None, gt=0)
    starts: str = Field("", description="When it applies, e.g. 2027-02")
    estimate: bool = True
    as_of: str
    source: str = ""


class Country(Strict):
    code: str
    name: str
    currency: str
    tax_model: str
    tax_params: dict = Field(default_factory=dict)
    tax_source: str = ""
    tax_as_of: str
    avg_gross_monthly: float | None = None
    avg_gross_as_of: str | None = None
    avg_gross_next_release: str | None = None
    avg_gross_source: str = ""
    blue_card: list[BlueCard] = Field(default_factory=list)
    blue_card_next: BlueCardNext | None = None
    contract_rule: str | None = None

    @field_validator("code")
    @classmethod
    def _code(cls, v: str) -> str:
        if not COUNTRY_CODE.match(v):
            raise ValueError("Use a two-letter country code, e.g. LV")
        return v

    @field_validator("currency")
    @classmethod
    def _currency(cls, v: str) -> str:
        if not CURRENCY.match(v):
            raise ValueError("Use a three-letter currency code, e.g. EUR")
        return v

    @field_validator("tax_as_of", "avg_gross_as_of", "avg_gross_next_release")
    @classmethod
    def _dates(cls, v: str | None) -> str | None:
        return _date(v)


# ---------------------------------------------------------------- cities
class Numbeo(Sourced):
    col_index: float = Field(gt=0, description="Cost of living excluding rent (New York = 100)")
    rent_index: float | None = None
    col_plus_rent_index: float | None = None
    groceries_index: float | None = None
    restaurant_index: float | None = None
    purchasing_power_index: float | None = None
    single_person_no_rent: float | None = None
    rent_1bed_centre: float | None = None
    rent_1bed_outside: float | None = None
    meal_mcdonalds: float | None = None
    cappuccino: float | None = None
    transit_pass: float | None = None
    avg_net_salary: float | None = None


class Housing(Sourced):
    planning_monthly: float = Field(gt=0, description="A small 30-45 m2 flat near the centre, utilities included")
    breakdown: str = ""
    market_range: str = ""


class Wages(Sourced):
    city_avg_gross: float = Field(gt=0)


class City(Strict):
    slug: str
    name: str
    country: str
    aliases: list[str] = Field(default_factory=list)
    numbeo: Numbeo
    housing: Housing | None = Field(None, description="Left out for the home city: the baseline's housing applies")
    fixed_monthly: float | None = Field(None, ge=0, description="Fixed costs here, e.g. private health insurance")
    wages: Wages | None = None
    prices: dict[str, float] = Field(default_factory=dict)
    notes: str = ""

    @field_validator("slug")
    @classmethod
    def _slug(cls, v: str) -> str:
        if not CITY_SLUG.match(v):
            raise ValueError("Use a lowercase slug without accents, e.g. krakow")
        return v


# ---------------------------------------------------------------- salary
Period = Literal["month", "year", "hour"]
Basis = Literal["gross", "net"]


class Salary(Strict):
    """What a job pays, as the listing states it."""

    currency: str
    min: float | None = Field(None, gt=0)
    max: float | None = Field(None, gt=0)
    ask: float | None = Field(None, gt=0, description="What Ed asked for, or will ask")
    period: Period = "month"
    basis: Basis = "gross"
