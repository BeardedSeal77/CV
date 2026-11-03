import frontmatter
from pydantic import BaseModel, ConfigDict, Field

from cv.model.get_section_path import get_section_path
from utils.errors import ActionError
from utils.files import write_atomic


class SectionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(description='e.g. "site", "about", "skills", "experience/01-acme"')
    content: str = Field(description="The whole file: YAML frontmatter between --- lines, then Markdown")


def update_section(payload: SectionUpdate) -> dict:
    """Replace a CV section (the frontmatter must stay valid YAML). Changes the
    local data only; publishing still needs a push of the data repo."""
    try:
        frontmatter.loads(payload.content)
    except Exception as err:
        raise ActionError(f"The frontmatter isn't valid YAML: {err}") from None
    path = get_section_path(payload.name)
    path.parent.mkdir(parents=True, exist_ok=True)
    write_atomic(path, payload.content.replace("\r\n", "\n").rstrip() + "\n")
    return {"ok": True, "name": payload.name}
