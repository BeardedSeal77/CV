from typing import Literal

from pydantic import BaseModel, ConfigDict

from jobs.model import store


class UpdateDocument(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    doc: Literal["jd", "jd_en", "notes"]
    text: str


def update_document(payload: UpdateDocument) -> dict:
    """Replace a job's description (doc "jd", as listed), its English translation
    (doc "jd_en", for listings in another language, e.g. Polish) or interview
    prep notes (doc "notes")."""
    store.set_doc(payload.id, payload.doc, payload.text)
    return {"ok": True, "id": payload.id}
