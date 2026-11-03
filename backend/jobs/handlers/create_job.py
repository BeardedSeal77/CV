from pydantic import Field

from jobs.model import pay_link, store, view
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
    letter. city_id (the pay data's city file) is found from city, and salary
    (currency, min, max, ask, period, basis) is read from pay, unless you pass
    them; the answer's city_note says when the city text named several."""
    fields = payload.model_dump(exclude={"jd", "letter", "allow_duplicate"})
    # Defaults don't count as passed: only a city_id or salary the caller gave stops the lookup
    given = {k: v for k, v in fields.items() if k not in ("city_id", "salary") or k in payload.model_fields_set}
    derived, note = pay_link.derive(given)
    listing = Listing.model_validate({**fields, **derived})
    opp = store.add(listing, jd=payload.jd, letter=payload.letter, allow_duplicate=payload.allow_duplicate)
    return {**view.summary(opp), "city_note": note or None}
