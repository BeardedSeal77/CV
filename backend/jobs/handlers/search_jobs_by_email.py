import re
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field

from jobs.model import store, view

# Mail domains that say nothing about which company wrote
_GENERIC = {"gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me"}
# Applicant tracking systems that send on a company's behalf
_ATS = ("workable", "lever", "ashby", "teamtailor", "greenhouse", "smartrecruiters", "recruitee", "personio")


class SearchByEmail(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sender: str = Field("", description='The From address or "Name <address>"')
    subject: str = ""
    snippet: str = Field("", description="A line or two of the body helps when the sender is an ATS")


def _domain(value: str) -> str:
    host = urlsplit(value if "://" in value else f"http://{value}").hostname or ""
    return host.removeprefix("www.")


def _root(domain: str) -> str:
    """oxylabs.io, career.oxylabs.io, mail.oxylabs.io -> oxylabs"""
    parts = domain.split(".")
    return parts[-2] if len(parts) >= 2 else domain


def search_jobs_by_email(payload: SearchByEmail) -> dict:
    """Which job an email is about: matches the sender's domain against each
    job's listing link, website and apply email, and the company name against
    the sender, subject and snippet. Answers candidates with the reasons, best
    first. Jobs Ed never applied to (ruled out, not interested) are left out."""
    address = re.search(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", payload.sender)
    sender_domain = address.group(1).lower() if address else ""
    text = f"{payload.sender} {payload.subject} {payload.snippet}".lower()

    # An ATS domain is shared by many companies, so it never identifies one
    sender_is_ats = any(ats in sender_domain for ats in _ATS)
    scored = []
    for opp in store.list_all():
        if opp.application.status in ("Ruled out", "Not interested"):  # never applied to
            continue
        reasons = []
        if sender_domain and sender_domain not in _GENERIC and not sender_is_ats:
            job_domains = {_domain(v) for v in (opp.url, opp.website) if v}
            if opp.email and "@" in opp.email:
                job_domains.add(opp.email.split("@", 1)[1].lower())
            job_domains = {d for d in job_domains if d and not any(ats in d for ats in _ATS)}
            if any(_root(d) == _root(sender_domain) for d in job_domains):
                reasons.append(f"sender domain {sender_domain}")
        name = opp.company.lower()
        if len(name) >= 3 and re.search(rf"\b{re.escape(name)}\b", text):
            reasons.append(f'company "{opp.company}" named')
        if reasons:
            if opp.role.lower() in text:
                reasons.append("role named")
            # A reply is almost always about a role Ed applied for
            if any(e.status == "Applied" for e in opp.application.events):
                reasons.append("applied to")
            scored.append((len(reasons), opp, reasons))
    scored.sort(key=lambda s: (-s[0], s[1].company))
    return {"matches": [{**view.summary(o), "reasons": r} for _, o, r in scored]}
