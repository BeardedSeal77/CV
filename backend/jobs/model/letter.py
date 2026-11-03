"""letter.md keeps private prep notes above the first `---` line and the letter
itself below it. Only the letter is ever printed.

The letter carries no date: the letter page prints the day it renders, or the
job's letter_date when one is fixed, so a letter sent later is never stale."""

import re
from datetime import date

_RULE = re.compile(r"^---[ \t]*$", re.M)
_MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
# A block that is only a date: "3 November 2026", "November 3, 2026", "2026-11-03"
_DATE_BLOCK = re.compile(
    rf"^\s*(\d{{1,2}} ({_MONTHS}) \d{{4}}|({_MONTHS}) \d{{1,2}}, \d{{4}}|\d{{4}}-\d{{2}}-\d{{2}})\s*$", re.I
)


def split_letter(text: str) -> dict:
    normalised = text.replace("\r\n", "\n")
    match = _RULE.search(normalised)
    if not match:
        return {"notes": "", "text": normalised.strip()}
    return {"notes": normalised[: match.start()].strip(), "text": normalised[match.end() :].strip()}


def join_letter(notes: str, text: str) -> str:
    return f"{notes.strip()}\n\n---\n\n{text.strip()}\n"


def strip_date(text: str) -> tuple[str, str]:
    """The letter without a date block among its first three blocks, and the
    date it had ("" when none)."""
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip())
    for i, block in enumerate(blocks[:3]):
        if _DATE_BLOCK.match(block):
            return "\n\n".join(blocks[:i] + blocks[i + 1 :]), block.strip()
    return "\n\n".join(blocks), ""


def letter_date(fixed: str = "") -> str:
    """The date printed on a letter: the fixed one, else today, as en-GB
    ("3 November 2026")."""
    day = date.fromisoformat(fixed) if fixed else date.today()
    return f"{day.day} {day.strftime('%B')} {day.year}"
