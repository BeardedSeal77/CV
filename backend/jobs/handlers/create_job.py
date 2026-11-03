from pydantic import Field

from jobs.model import store, view
from jobs.model.schema import Listing


class CreateJob(Listing):
    jd: str = Field("", description="Job description, full or summary")
    letter: str = Field("", description="Cover letter text, if already written")


def create_job(payload: CreateJob) -> dict:
    """Add a job to the board's Backlog (status Shortlisted). Fields: company and
    role (required), country (ISO code), city, method (indeed, company_site,
    linkedin or other), platform (e.g. Workable), url (the application link),
    website (the company's site), email, pay, hours, mode, fit (Strong, Good or
    Stretch), posted (date listed, YYYY-MM-DD), deadline, size, what (one line
    on the company), jd, letter."""
    listing = Listing.model_validate(payload.model_dump(exclude={"jd", "letter"}))
    return view.summary(store.add(listing, jd=payload.jd, letter=payload.letter))
