from pydantic import Field

from jobs.model import store, view
from jobs.model.schema import Listing


class CreateJob(Listing):
    jd: str = Field("", description="Job description, full or summary")
    letter: str = Field("", description="Cover letter text, if already written")
    allow_duplicate: bool = Field(
        False, description="Add even when the same link, or the same company and role, is already on the board"
    )


def create_job(payload: CreateJob) -> dict:
    """Add a job to the board's Backlog (status Shortlisted). Refused with code
    "duplicate" (and existing_id) when the same listing link, or the same
    company and role, is already on the board. Fields: company and role
    (required), country (ISO code), city, method (indeed, company_site,
    linkedin or other), platform (e.g. Workable), url (the application link),
    website (the company's site), email, pay, hours, mode, fit (Strong, Good or
    Stretch), interest (High, Medium or Low; defaults from the fit: Strong High,
    Good Medium, else Low), posted (date listed, YYYY-MM-DD), deadline (the
    listing's closing date, only when it gives one; jobs.expire_closed moves
    jobs past it to Expired), size, what (one line on the company), jd,
    letter."""
    listing = Listing.model_validate(payload.model_dump(exclude={"jd", "letter", "allow_duplicate"}))
    opp = store.add(listing, jd=payload.jd, letter=payload.letter, allow_duplicate=payload.allow_duplicate)
    return view.summary(opp)
