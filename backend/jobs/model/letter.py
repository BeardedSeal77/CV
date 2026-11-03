"""letter.md keeps private prep notes above the first `---` line and the letter
itself below it. Only the letter is ever printed."""

import re

_RULE = re.compile(r"^---[ \t]*$", re.M)


def split_letter(text: str) -> dict:
    normalised = text.replace("\r\n", "\n")
    match = _RULE.search(normalised)
    if not match:
        return {"notes": "", "text": normalised.strip()}
    return {"notes": normalised[: match.start()].strip(), "text": normalised[match.end() :].strip()}


def join_letter(notes: str, text: str) -> str:
    return f"{notes.strip()}\n\n---\n\n{text.strip()}\n"
