from pydantic import BaseModel, ConfigDict

from utils.datadir import cv_dir


class NoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


def list_sections(payload: NoInput) -> dict:
    """The CV's sections, by name (relative to data/cv)."""
    root = cv_dir()
    names = sorted(
        str(p.relative_to(root)).replace("\\", "/").removesuffix(".md")
        for p in root.rglob("*.md")
        if "media" not in p.relative_to(root).parts
    )
    return {"sections": names}
