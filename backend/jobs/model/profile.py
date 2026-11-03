"""What an agent needs besides the job itself: the applicant profile (standard
form answers), the letter rules, and the CV's own text. All of it lives in the
private data repo."""

import re
from pathlib import Path

import frontmatter

from utils.datadir import REPO_ROOT, cv_dir, jobhunt_dir


def read_profile() -> dict:
    """data/jobhunt/profile.md: structured answers in the frontmatter, notes for
    the agent in the body, plus the contact details from the CV's site.md."""
    site = frontmatter.load(cv_dir() / "site.md").metadata
    contact = {k: site.get(k, "") for k in ("name", "email", "phone", "location", "website", "linkedin", "github")}
    path = jobhunt_dir() / "profile.md"
    if not path.is_file():
        return {"contact": contact, "answers": {}, "notes": "", "missing": "data/jobhunt/profile.md"}
    doc = frontmatter.load(path)
    return {"contact": contact, **doc.metadata, "notes": doc.content.strip()}


# The standard answers every form asks, in the order they're usually asked
STANDARD_ANSWERS = (
    "work_authorisation",
    "needs_sponsorship",
    "notice_period",
    "earliest_start",
    "relocation",
    "current_role",
    "years_experience",
    "education",
    "english_cefr",
)
# Forms reject some characters (Comarch refused "/"); typographic ones are risky too
UNSAFE = re.compile(r"[/\\\u2018\u2019\u201c\u201d\u2013\u2014\u2026]")


def _version(text: str, limit: int | None = None) -> dict:
    out = {"text": text, "chars": len(text), "plain": not UNSAFE.search(text)}
    if limit:
        out["max"] = limit
        out["fits"] = len(text) <= limit
    return out


def form_answers(profile: dict) -> dict:
    """Each standard answer in full and in its short versions (profile.md's
    short_answers: {key: {"50": ..., "200": ...}}), with character counts and
    whether it uses only plain punctuation; problems lists what needs Ed."""
    shorts = profile.get("short_answers") or {}
    questions = profile.get("answers") or {}
    out, problems = {}, []
    for key in (*STANDARD_ANSWERS, *questions):
        value = profile.get(key) if key in STANDARD_ANSWERS else questions.get(key)
        full = str(value or "").strip()
        if not full:
            problems.append(f"{key}: blank, ask Ed")
        versions = [_version(str(text).strip(), int(limit)) for limit, text in sorted(
            (shorts.get(key) or {}).items(), key=lambda kv: int(kv[0])
        )]
        for v in versions:
            if not v["fits"]:
                problems.append(f"{key}: the {v['max']}-character version has {v['chars']}")
            if not v["plain"]:
                problems.append(f"{key}: the {v['max']}-character version has a slash or typographic character")
        out[key] = {"full": _version(full), "short": versions}
    return {"answers": out, "problems": problems}


def read_letter_rules() -> str:
    path = jobhunt_dir() / "letter-rules.md"
    return path.read_text(encoding="utf-8").strip() if path.is_file() else ""


def read_cv_sections() -> dict[str, str]:
    """Every CV section as Markdown, by name (e.g. "experience/01-bmw")."""
    root = cv_dir()
    out = {}
    for path in sorted(root.rglob("*.md")):
        rel = path.relative_to(root)
        if "media" in rel.parts:
            continue
        out[str(rel.with_suffix("")).replace("\\", "/")] = path.read_text(encoding="utf-8")
    return out


def repo_relative(path: Path) -> str:
    """A data file's path as the host sees it (relative to the repo root)."""
    try:
        return str(path.resolve().relative_to(REPO_ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)
