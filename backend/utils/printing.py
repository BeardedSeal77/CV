"""Prints the website's document pages (the CV, the portfolio, cover letters)
to PDF with Playwright, from the running website (CV_WEB_URL), so they use the
site's own components, fonts and print theme. Same checks as lib/pdf.mjs."""

import io
import os
import re
from contextlib import contextmanager

import frontmatter
from playwright.sync_api import Browser, sync_playwright
from pypdf import PdfReader, PdfWriter

from utils.datadir import cv_dir
from utils.errors import ActionError

# Fixed .print-sheet pages clip, so an overflowing sheet fails rather than
# shipping cut-off text
_OVERFLOW_JS = """
() => [...document.querySelectorAll('.print-sheet')].flatMap((sheet, index) => {
  const limit = sheet.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sheet).paddingBottom)
  const bottom = Math.max(...[...sheet.querySelectorAll('*')].map((el) => el.getBoundingClientRect().bottom))
  const overMm = (bottom - limit) / (96 / 25.4)
  return overMm > 0.5 ? [`page ${index + 1} by ${overMm.toFixed(1)}mm`] : []
})
"""


def web_url() -> str:
    return os.environ.get("CV_WEB_URL", "http://127.0.0.1:3030").rstrip("/")


@contextmanager
def browser():
    """An installed Chrome or Edge, else Playwright's own Chromium (Docker)."""
    with sync_playwright() as playwright:
        launched = None
        for channel in ("chrome", "msedge", None):
            try:
                launched = playwright.chromium.launch(channel=channel) if channel else playwright.chromium.launch()
                break
            except Exception:
                continue
        if launched is None:
            raise ActionError("No browser found to print the PDF (Chrome, Edge or Playwright's Chromium).", status=500)
        try:
            yield launched
        finally:
            launched.close()


def print_page(browser: Browser, route: str) -> bytes:
    url = f"{web_url()}{route}"
    page = browser.new_page(color_scheme="light")
    try:
        try:
            response = page.goto(url, wait_until="networkidle")
        except Exception as err:
            raise ActionError(f"Can't reach {url}: is the website running? {err}", status=502)
        if not response or not response.ok:
            raise ActionError(f"{url} returned {response.status if response else 'nothing'}", status=502)
        page.emulate_media(media="print")
        page.evaluate("() => document.fonts.ready")
        overflows = page.evaluate(_OVERFLOW_JS)
        if overflows:
            raise ActionError(f"{route} overflows: {', '.join(overflows)}", code="overflow")
        return page.pdf(prefer_css_page_size=True, print_background=True)
    finally:
        page.close()


def site_meta() -> tuple[dict, list[str]]:
    """site.md's settings, and the CV's keywords: the role title and the listed
    skills ("Working style" traits excluded), only what the CV itself says."""
    site = frontmatter.load(cv_dir() / "site.md").metadata
    skills_file = cv_dir() / "skills.md"
    groups = frontmatter.load(skills_file).metadata.get("groups", []) if skills_file.is_file() else []
    items = [i for g in groups if not re.search("working style", g.get("title", ""), re.I) for i in g.get("items", [])]
    keywords = list(dict.fromkeys([site.get("title", ""), *items]))
    return site, [k for k in keywords if k]


def merge(parts: list[bytes], title: str) -> tuple[bytes, list[int]]:
    """Joins printed PDFs in order with the CV's metadata; returns the bytes and
    each part's page count."""
    site, keywords = site_meta()
    writer = PdfWriter()
    pages = []
    for data in parts:
        reader = PdfReader(io.BytesIO(data))
        pages.append(len(reader.pages))
        for page in reader.pages:
            writer.add_page(page)
    writer.add_metadata(
        {
            "/Title": title,
            "/Author": site.get("name", ""),
            "/Subject": f"{site.get('title', '')}: {site.get('tagline', '')}",
            # commas keep multi-word skills intact
            "/Keywords": ", ".join(keywords),
        }
    )
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue(), pages
