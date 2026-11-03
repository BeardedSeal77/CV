"""Where the personal data lives: the same rules as lib/data-dir.mjs in the stack.

  CV_DATA_DIR set   -> that folder (relative to the repo root)
  data/cv exists    -> data/ (a checkout of the private data repo)
  otherwise         -> data.example/, with a warning
"""

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
_warned = False


def data_dir() -> Path:
    global _warned
    env = os.environ.get("CV_DATA_DIR")
    if env:
        folder = (REPO_ROOT / env).resolve()
        if not (folder / "cv").is_dir():
            raise RuntimeError(f"CV_DATA_DIR={env} has no cv/ folder.")
        return folder
    data = REPO_ROOT / "data"
    if (data / "cv").is_dir():
        return data
    if not _warned:
        print("data/cv not found: using the sample data in data.example/.", file=sys.stderr)
        _warned = True
    return REPO_ROOT / "data.example"


def cv_dir() -> Path:
    return data_dir() / "cv"


def jobhunt_dir() -> Path:
    return data_dir() / "jobhunt"
