"""Finding a city file from what a listing says: "Krakow", "Cracow",
"Wroclaw (listed)", "Vilnius or Kaunas". Case and accents are ignored."""

import re
import unicodedata

from . import store

# Letters NFKD leaves whole
_FOLD = str.maketrans({"ł": "l", "Ł": "l", "ø": "o", "đ": "d", "ß": "ss"})


def fold(text: str) -> str:
    text = unicodedata.normalize("NFKD", (text or "").translate(_FOLD))
    return "".join(c for c in text if not unicodedata.combining(c)).lower().strip()


def resolve(text: str) -> dict:
    """The city named in the text, by slug, name or alias. When several are
    named, the first wins and the note says which others were seen."""
    folded = fold(text)
    if not folded:
        return {"city_id": "", "note": ""}
    found = []
    for city in store.all_cities():
        for name in {city.slug, city.name, *city.aliases}:
            m = re.search(rf"(?<![a-z]){re.escape(fold(name))}(?![a-z])", folded)
            if m:
                found.append((m.start(), city.slug))
                break
    if not found:
        return {"city_id": "", "note": f'No city file matches "{text}".'}
    found.sort()
    first = found[0][1]
    others = [slug for _, slug in found[1:]]
    note = f"Also named: {', '.join(others)}; graded for {first}." if others else ""
    return {"city_id": first, "note": note}


def guess_slug(text: str) -> str:
    """A slug for a city that has no file yet, so the missing file can be named."""
    first = re.split(r"[,(/]| or ", fold(text))[0].strip()
    return re.sub(r"[^a-z0-9]+", "-", first).strip("-")
