import re
from pathlib import Path

from utils.datadir import cv_dir
from utils.errors import ActionError

_NAME = re.compile(r"^[a-z0-9][a-z0-9/_-]*$", re.I)


def get_section_path(name: str) -> Path:
    """The file behind a CV section name, refusing anything outside data/cv."""
    root = cv_dir().resolve()
    clean = name.replace("\\", "/").removesuffix(".md")
    if not _NAME.match(clean) or ".." in clean:
        raise ActionError(f"Invalid section name: {name}")
    path = (root / f"{clean}.md").resolve()
    if root not in path.parents:
        raise ActionError(f"Invalid section name: {name}")
    return path
