from jobs.handlers._inputs import JobRef
from jobs.model import store
from jobs.model.letter import split_letter
from jobs.model.profile import read_cv_sections, read_letter_rules, read_profile
from jobs.model.schema import COLUMN_OF

# Letters to companies that answered are the best examples of the voice
_EXAMPLE_ORDER = ("accepted", "interview", "applied", "declined", "backlog", "archived")


def get_letter_brief(payload: JobRef) -> dict:
    """Everything needed to draft this job's cover letter in one call: the job
    (listing and description), the whole CV as Markdown, the letter rules, the
    applicant profile, and up to three of Ed's earlier letters as examples of
    his voice. Draft from the CV's facts only, then save it with jobs.set_letter."""
    data = store.get_with_docs(payload.id)
    opp = data["opportunity"]

    examples = []
    others = sorted(
        (o for o in store.list_all() if o.id != opp.id),
        key=lambda o: _EXAMPLE_ORDER.index(COLUMN_OF[o.application.status]),
    )
    for other in others:
        text = split_letter(store.read_doc(other.id, "letter"))["text"]
        if text:
            examples.append({"company": other.company, "role": other.role, "status": other.application.status, "text": text})
        if len(examples) == 3:
            break

    return {
        "job": {
            **opp.model_dump(exclude={"application"}),
            "status": opp.application.status,
            "description": data["jd"],
            "current_letter": split_letter(data["letter"]),
            "prep_notes": data["notes"],
        },
        "rules": read_letter_rules(),
        "profile": read_profile(),
        "cv": read_cv_sections(),
        "examples": examples,
    }
