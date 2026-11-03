from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store
from jobs.model.letter import join_letter, split_letter, strip_date


class UpdateLetter(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    text: str = Field(
        description="The printed letter: name line, contact line (parts separated by a middle dot), "
        "salutation, paragraphs, sign-off. Blank lines separate blocks. No date: the page prints it."
    )
    notes: str | None = Field(None, description="Private prep notes; omit to keep the current ones")


def update_letter(payload: UpdateLetter) -> dict:
    """Write or replace a job's cover letter. Keeps the prep notes unless notes
    is given. A date line is taken out (date_removed says which): the letter
    page prints the day it renders, or the job's letter_date when fixed."""
    current = split_letter(store.read_doc(payload.id, "letter"))
    notes = payload.notes if payload.notes is not None else current["notes"]
    text, removed = strip_date(payload.text)
    store.set_doc(payload.id, "letter", join_letter(notes, text))
    return {"ok": True, "id": payload.id, "date_removed": removed or None}
