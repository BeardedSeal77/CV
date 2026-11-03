"""What an agent needs besides the job itself: the applicant profile (standard
form answers), the letter rules, and the CV's own text. All of it lives in the
private data repo."""

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
