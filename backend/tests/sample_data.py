"""One temporary copy of data.example shared by every test module, removed
when the test run exits. Import this before anything from the backend."""

import atexit
import os
import shutil
import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

TMP = Path(tempfile.mkdtemp(prefix="cv-backend-test-"))
shutil.copytree(BACKEND.parent / "data.example", TMP / "data", dirs_exist_ok=True)
os.environ["CV_DATA_DIR"] = str(TMP / "data")
os.environ.pop("CV_AUTOCOMMIT", None)
atexit.register(shutil.rmtree, TMP, ignore_errors=True)

EXAMPLE = "example-robotics-backend"  # Interview, fit Strong, has a letter
SAMPLE = "sample-data-ai-engineer"  # Shortlisted, fit Good, no letter
