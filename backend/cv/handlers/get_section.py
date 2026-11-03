from pydantic import BaseModel, ConfigDict, Field

from cv.model.get_section_path import get_section_path
from utils.errors import NotFound


class SectionRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(description='e.g. "site", "about", "skills", "experience/01-acme"')


def get_section(payload: SectionRef) -> dict:
    """One CV section as Markdown with its frontmatter."""
    path = get_section_path(payload.name)
    if not path.is_file():
        raise NotFound(f"No section {payload.name}")
    return {"name": payload.name, "content": path.read_text(encoding="utf-8")}
