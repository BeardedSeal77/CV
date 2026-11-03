"""Builds the PDFs for one application, printed from the running website:
  letter       the cover letter on its own
  application  the CV, optionally with the cover letter in front and the
               portfolio behind
"""

import re
from pathlib import Path

from utils.printing import browser, merge, print_page, site_meta

from .store import opp_dir, read


def build(job_id: str, kind: str = "application", cover_letter: bool = True, portfolio: bool = False) -> dict:
    opp = read(job_id)
    site, _ = site_meta()

    parts: list[tuple[str, str]] = []
    if kind == "letter" or cover_letter:
        parts.append(("letter", f"/jobs/{job_id}/letter"))
    if kind == "application":
        parts.append(("cv", "/cv"))
        if portfolio:
            parts.append(("portfolio", "/portfolio/print"))

    with browser() as b:
        printed = [print_page(b, route) for _, route in parts]

    label = "cover letter" if kind == "letter" else ("application" if cover_letter else "CV")
    data, counts = merge(printed, f"{site.get('name', '')}: {label} for {opp.company}")
    pages = {key: count for (key, _), count in zip(parts, counts)}

    prefix = re.sub(r"_CV$", "", Path(site.get("cvPdf", "CV.pdf")).stem)
    company = re.sub(r"[^A-Za-z0-9]+", "_", opp.company).strip("_")
    suffix = (
        "Cover_Letter"
        if kind == "letter"
        else f"{'Application' if cover_letter else 'CV'}{'_with_Portfolio' if portfolio else ''}"
    )
    name = f"{prefix}_{company}_{suffix}.pdf"
    folder = opp_dir(job_id).parents[1] / "output" / job_id
    folder.mkdir(parents=True, exist_ok=True)
    file = folder / name
    file.write_bytes(data)

    return {
        "file": str(file),
        "name": name,
        "letterPages": pages.get("letter", 0),
        "cvPages": pages.get("cv", 0),
        "portfolioPages": pages.get("portfolio", 0),
    }


def output_file(job_id: str, name: str | None) -> Path | None:
    """A built PDF: the named one (only names actually in the folder), else the newest."""
    folder = opp_dir(job_id).parents[1] / "output" / job_id
    if not folder.is_dir():
        return None
    files = [f for f in folder.iterdir() if f.suffix == ".pdf"]
    if name:
        return next((f for f in files if f.name == name), None)
    return max(files, key=lambda f: f.stat().st_mtime, default=None)
