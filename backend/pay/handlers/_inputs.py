from pydantic import BaseModel, ConfigDict, Field


class NoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CityRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city: str = Field(description="A city slug (e.g. krakow) or its name as a listing writes it")
