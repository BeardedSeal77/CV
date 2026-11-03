"""Builds the PDFs for one application, printed from the running website, into
jobhunt/output/<id>/. Forms differ: some take one file, some a CV field and a
separate "other documents" field, so every combination is a kind:

  cv                     the CV
  letter                 the cover letter
  portfolio              the portfolio
  application            the cover letter, then the CV, in one file
  cv_portfolio           the CV, then the portfolio
  application_portfolio  the cover letter, the CV and the portfolio

A file is reused while it is newer than everything it is printed from (the
CV's files, and the job's letter), and rebuilt otherwise.
"""

import re
from pathlib import Path

from utils.datadir import cv_dir
from utils.errors import ActionError
from utils.printing import browser, merge, print_page, site_meta

from .store import letter_path, opp_dir, read, read_doc

ROUTES = {"letter": "/jobs/{id}/letter", "cv": "/cv", "portfolio": "/portfolio/print"}

# kind: (parts in order, file name suffix, whether the name carries the company)
KINDS: dict[str, tuple[tuple[str, ...], str, bool]] = {
    "cv": (("cv",), "CV", False),
    "letter": (("letter",), "Cover_Letter", True),
    "portfolio": (("portfolio",), "Portfolio", False),
    "application": (("letter", "cv"), "Application", True),
    "cv_portfolio": (("cv", "portfolio"), "CV_with_Portfolio", False),
    "application_portfolio": (("letter", "cv", "portfolio"), "Application_with_Portfolio", True),
}

LABELS = {
    "cv": "CV",
    "letter": "cover letter",
    "portfolio": "portfolio",
    "application": "application",
    "cv_portfolio": "CV with portfolio",
    "application_portfolio": "application with portfolio",
}


def output_dir(job_id: str) -> Path:
    return opp_dir(job_id).parents[1] / "output" / job_id


def file_name(job_id: str, kind: str) -> str:
    """e.g. Erin_Cullen_CV.pdf, Erin_Cullen_Cover_Letter_Comarch.pdf"""
    parts, suffix, with_company = KINDS[kind]
    site, _ = site_meta()
    prefix = re.sub(r"_CV$", "", Path(site.get("cvPdf", "CV.pdf")).stem)
    name = f"{prefix}_{suffix}"
    if with_company:
        name += "_" + re.sub(r"[^A-Za-z0-9]+", "_", read(job_id).company).strip("_")
    return f"{name}.pdf"


def _sources_mtime(job_id: str, parts: tuple[str, ...]) -> float:
    """The newest change among the files the parts are printed from."""
    times = []
    if "cv" in parts or "portfolio" in parts:
        times += [p.stat().st_mtime for p in cv_dir().rglob("*") if p.is_file()]
    if "letter" in parts:
        times.append((cv_dir() / "site.md").stat().st_mtime)
        if letter_path(job_id).is_file():
            times.append(letter_path(job_id).stat().st_mtime)
    return max(times, default=0.0)


def _describe(job_id: str, kind: str, file: Path, rebuilt: bool, pages: dict | None = None) -> dict:
    return {
        "kind": kind,
        "file": str(file),
        "name": file.name,
        "size": file.stat().st_size,
        "rebuilt": rebuilt,
        "parts": list(KINDS[kind][0]),
        **({"pages": pages} if pages else {}),
    }


def ensure(job_id: str, kind: str, force: bool = False) -> dict:
    """The kind's PDF, reused while it is newer than its sources, else printed."""
    if kind not in KINDS:
        raise ActionError(f"No PDF kind {kind}. Kinds: {', '.join(KINDS)}")
    parts = KINDS[kind][0]
    if "letter" in parts and not read_doc(job_id, "letter").strip():
        raise ActionError("This job has no cover letter yet: draft one first (jobs.letter_brief).", code="no_letter")

    file = output_dir(job_id) / file_name(job_id, kind)
    if not force and file.is_file() and file.stat().st_mtime >= _sources_mtime(job_id, parts):
        return _describe(job_id, kind, file, rebuilt=False)

    site, _ = site_meta()
    company = read(job_id).company
    with browser() as b:
        printed = [print_page(b, ROUTES[part].format(id=job_id)) for part in parts]
    data, counts = merge(printed, f"{site.get('name', '')}: {LABELS[kind]} for {company}")
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_bytes(data)
    return _describe(job_id, kind, file, rebuilt=True, pages=dict(zip(parts, counts)))


def output_file(job_id: str, name: str | None) -> Path | None:
    """A built PDF: the named one (only names actually in the folder), else the newest."""
    folder = output_dir(job_id)
    if not folder.is_dir():
        return None
    files = [f for f in folder.iterdir() if f.suffix == ".pdf"]
    if name:
        return next((f for f in files if f.name == name), None)
    return max(files, key=lambda f: f.stat().st_mtime, default=None)
