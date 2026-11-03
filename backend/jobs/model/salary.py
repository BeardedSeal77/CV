"""Reading a salary out of a listing's free-text pay: "EUR 5,000-8,500 / month
gross", "From EUR 4,500 / month + options", "Not listed (asked PLN 16,000
gross, UoP)". The text itself is never changed."""

import re

_CURRENCIES = [
    (re.compile(r"€|\beur(?:os?)?\b", re.I), "EUR"),
    (re.compile(r"\bpln\b|zł|\bzl\b|\bzloty\b", re.I), "PLN"),
    (re.compile(r"(?i:\bzar\b)|(?<![A-Za-z])R\s?\d"), "ZAR"),
    (re.compile(r"\$|\busd\b", re.I), "USD"),
    (re.compile(r"£|\bgbp\b", re.I), "GBP"),
]
# 5,000 / 5 000 / 5.000 / 13,355.34 / 60k / 4500
_NUMBER = r"\d{1,3}(?:[ ,.\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?\s*k\b|\d+(?:[.,]\d{1,2})?"
_ASK = re.compile(rf"\bask(?:ed|ing)?\b(?:\s+for)?[^\d]{{0,12}}({_NUMBER})", re.I)
_RANGE = re.compile(rf"({_NUMBER})\s*(?:-|–|—|to)\s*[^\d]{{0,6}}({_NUMBER})", re.I)


def _amount(text: str) -> float:
    text = text.strip().lower().replace("\u00a0", " ")
    if text.endswith("k"):
        return float(text[:-1].strip().replace(",", ".")) * 1000
    grouped = re.fullmatch(r"(\d{1,3}(?:[ ,.]\d{3})+)(?:[.,](\d{1,2}))?", text)
    if grouped:
        whole = re.sub(r"[ ,.]", "", grouped.group(1))
        return float(f"{whole}.{grouped.group(2)}" if grouped.group(2) else whole)
    return float(text.replace(",", "."))


def currency_of(text: str) -> str:
    return next((code for pattern, code in _CURRENCIES if pattern.search(text)), "")


def parse_pay(text: str) -> dict | None:
    """The salary a pay text states, or None when it states no figures."""
    text = (text or "").strip()
    currency = currency_of(text)
    if not text or not currency:
        return None
    lower = text.lower()
    out: dict = {"currency": currency}

    ask = _ASK.search(text)
    rest = text
    if ask:
        out["ask"] = _amount(ask.group(1))
        rest = text[: ask.start()] + text[ask.end() :]

    span = _RANGE.search(rest)
    if span:
        out["min"], out["max"] = sorted((_amount(span.group(1)), _amount(span.group(2))))
    else:
        single = re.search(_NUMBER, rest)
        if single:
            value = _amount(single.group(0))
            before = rest[: single.start()].lower()
            if re.search(r"\b(up to|max(imum)?|until)\b", before):
                out["max"] = value
            elif re.search(r"\b(from|min(imum)?|at least|starting)\b", before):
                out["min"] = value
            else:
                out["min"] = out["max"] = value

    if not any(k in out for k in ("min", "max", "ask")):
        return None
    if re.search(r"\b(year|annual|annually|yearly|p\.a\.)", lower) or re.search(r"/\s*y(ea)?r\b", lower):
        out["period"] = "year"
    elif re.search(r"\b(hour|hourly)\b", lower) or re.search(r"/\s*h(ou)?r?\b", lower):
        out["period"] = "hour"
    else:
        out["period"] = "month"
    out["basis"] = "net" if re.search(r"\b(net|netto)\b", lower) else "gross"
    return out
