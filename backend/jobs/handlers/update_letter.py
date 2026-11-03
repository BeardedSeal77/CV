from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store
from jobs.model.letter import join_letter, split_letter


class UpdateLetter(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    text: str = Field(
        description="The printed letter: name line, contact line (parts separated by a middle dot), date, "
        "salutation, paragraphs, sign-off. Blank lines separate blocks."
    )
    notes: str | None = Field(None, description="Private prep notes; omit to keep the current ones")


def update_letter(payload: UpdateLetter) -> dict:
    """Write or replace a job's cover letter. Keeps the prep notes unless notes is given."""
    current = split_letter(store.read_doc(payload.id, "letter"))
    notes = payload.notes if payload.notes is not None else current["notes"]
    store.set_doc(payload.id, "letter", join_letter(notes, payload.text))
    return {"ok": True, "id": payload.id}
