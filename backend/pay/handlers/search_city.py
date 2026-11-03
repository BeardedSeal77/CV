from pydantic import BaseModel, ConfigDict, Field

from pay.model.cities import resolve


class SearchCity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(description='The city as a listing writes it, e.g. "Wroclaw (listed)"')


def search_city(payload: SearchCity) -> dict:
    """The city file a listing's city text points to (by slug, name or alias,
    ignoring case and accents): city_id, empty when none matches, and a note
    when the text names more than one."""
    return resolve(payload.text)
