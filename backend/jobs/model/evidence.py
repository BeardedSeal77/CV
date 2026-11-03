"""Proof that an application went through, kept in the job's folder
(opportunities/<id>/evidence/): the confirmation page's address, text and
reference, and a screenshot of it."""

import base64
import binascii
import re
from pathlib import Path

from utils.errors import ActionError
from utils.files import write_atomic

from .store import opp_dir

MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024
_IMAGE_TYPES = {b"\x89PNG\r\n\x1a\n": ".png", b"\xff\xd8\xff": ".jpg"}


def folder(job_id: str) -> Path:
    return opp_dir(job_id) / "evidence"


def _free(path: Path) -> Path:
    """The path, or the first numbered variant not taken yet."""
    n = 2
    candidate = path
    while candidate.exists():
        candidate = path.with_name(f"{path.stem}-{n}{path.suffix}")
        n += 1
    return candidate


def _image(data: str) -> tuple[bytes, str]:
    raw = re.sub(r"^data:image/[a-z]+;base64,", "", data.strip())
    try:
        image = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise ActionError("screenshot must be a base64 PNG or JPEG.", code="invalid_screenshot") from None
    if len(image) > MAX_SCREENSHOT_BYTES:
        raise ActionError("The screenshot is over 10 MB.", code="invalid_screenshot")
    suffix = next((s for magic, s in _IMAGE_TYPES.items() if image.startswith(magic)), None)
    if suffix is None:
        raise ActionError("screenshot must be a PNG or JPEG.", code="invalid_screenshot")
    return image, suffix


def save(job_id: str, day: str, *, url: str = "", text: str = "", reference: str = "", screenshot: str = "") -> list[str]:
    """Writes what was given; returns the file names, relative to the job's folder."""
    saved = []
    target = folder(job_id)
    if screenshot:
        image, suffix = _image(screenshot)
        target.mkdir(parents=True, exist_ok=True)
        path = _free(target / f"{day}-confirmation{suffix}")
        path.write_bytes(image)
        saved.append(f"evidence/{path.name}")
    if url or text or reference:
        lines = [f"# Application confirmation, {day}", ""]
        if url:
            lines.append(f"- Page: {url}")
        if reference:
            lines.append(f"- Reference: {reference}")
        if text:
            lines += ["", text.strip()]
        target.mkdir(parents=True, exist_ok=True)
        path = _free(target / f"{day}-confirmation.md")
        write_atomic(path, "\n".join(lines) + "\n")
        saved.append(f"evidence/{path.name}")
    return saved
