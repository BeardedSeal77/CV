"""Builds the PDFs for one application, printed from the running website
(`npm run local`, CV_WEB_URL) so they use the site's own components, fonts and
print theme:
  letter       the cover letter on its own
  application  the CV, optionally with the cover letter in front and the
               portfolio behind
"""

import io
import os
import re
from pathlib import Path

import frontmatter
from playwright.sync_api import Browser, sync_playwright
from pypdf import PdfReader, PdfWriter

from utils.datadir import cv_dir
from utils.errors import ActionError

from .store import opp_dir, read

# Fixed .print-sheet pages clip, so an overflowing sheet fails rather than
# shipping cut-off text (same check as lib/pdf.mjs)
_OVERFLOW_JS = """
() => [...document.querySelectorAll('.print-sheet')].flatMap((sheet, index) => {
  const limit = sheet.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sheet).paddingBottom)
  const bottom = Math.max(...[...sheet.querySelectorAll('*')].map((el) => el.getBoundingClientRect().bottom))
  const overMm = (bottom - limit) / (96 / 25.4)
  return overMm > 0.5 ? [`page ${index + 1} by ${overMm.toFixed(1)}mm`] : []
})
"""


def web_url() -> str:
    return os.environ.get("CV_WEB_URL", "http://127.0.0.1:3000").rstrip("/")


def _launch(playwright) -> Browser:
    # Prefer an installed browser; in Docker, the image's own Chromium
    for channel in ("chrome", "msedge", None):
        try:
            return playwright.chromium.launch(channel=channel) if channel else playwright.chromium.launch()
        except Exception:
            continue
    raise ActionError("No browser found to print the PDF (Chrome, Edge or Playwright's Chromium).", status=500)


def _print(browser: Browser, url: str) -> bytes:
    page = browser.new_page(color_scheme="light")
    try:
        try:
            response = page.goto(url, wait_until="networkidle")
        except Exception as err:
            raise ActionError(f"Can't reach {url}: is the website running (npm run local)? {err}", status=502)
        if not response or not response.ok:
            raise ActionError(f"{url} returned {response.status if response else 'nothing'}", status=502)
        page.emulate_media(media="print")
        page.evaluate("() => document.fonts.ready")
        overflows = page.evaluate(_OVERFLOW_JS)
        if overflows:
            path = re.sub(r"^https?://[^/]+", "", url)
            raise ActionError(f"{path} overflows: {', '.join(overflows)}", code="overflow")
        return page.pdf(prefer_css_page_size=True, print_background=True)
    finally:
        page.close()


def _site() -> tuple[dict, list[str]]:
    site = frontmatter.load(cv_dir() / "site.md").metadata
    skills_file = cv_dir() / "skills.md"
    groups = frontmatter.load(skills_file).metadata.get("groups", []) if skills_file.is_file() else []
    items = [i for g in groups if not re.search("working style", g.get("title", ""), re.I) for i in g.get("items", [])]
    keywords = list(dict.fromkeys([site.get("title", ""), *items]))
    return site, [k for k in keywords if k]


def build(job_id: str, kind: str = "application", cover_letter: bool = True, portfolio: bool = False) -> dict:
    opp = read(job_id)
    site, keywords = _site()
    base = web_url()

    parts: list[tuple[str, str]] = []
    if kind == "letter" or cover_letter:
        parts.append(("letter", f"/jobs/{job_id}/letter"))
    if kind == "application":
        parts.append(("cv", "/cv"))
        if portfolio:
            parts.append(("portfolio", "/portfolio/print"))

    with sync_playwright() as playwright:
        browser = _launch(playwright)
        try:
            printed = [_print(browser, f"{base}{route}") for _, route in parts]
        finally:
            browser.close()

    writer = PdfWriter()
    pages: dict[str, int] = {}
    for (key, _), data in zip(parts, printed):
        reader = PdfReader(io.BytesIO(data))
        pages[key] = len(reader.pages)
        for page in reader.pages:
            writer.add_page(page)

    label = "cover letter" if kind == "letter" else ("application" if cover_letter else "CV")
    writer.add_metadata(
        {
            "/Title": f"{site.get('name', '')}: {label} for {opp.company}",
            "/Author": site.get("name", ""),
            "/Subject": f"{site.get('title', '')}: {site.get('tagline', '')}",
            # commas keep multi-word skills intact
            "/Keywords": ", ".join(keywords),
        }
    )

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
    with open(file, "wb") as handle:
        writer.write(handle)

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
