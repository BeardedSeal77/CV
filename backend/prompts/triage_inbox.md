---
description: Read Ed's email for replies to his applications and update the board.
arguments:
  since: How far back to look, e.g. 14d. Defaults to the last 14 days.
---
Read Ed's email for replies to his job applications from the last {since}, and update the board.

1. Search his Gmail for application replies in that window: confirmations, rejections, interview invitations, assessments and offers.
2. For each thread, call jobs_find_by_email with the sender, the subject and a line or two of the body. Take the best match. No match, or several equally likely: don't guess; list it for Ed.
3. Decide what the email means and log it with jobs_log_event, with source "gmail:<thread id>", the thread's link and the email's date. With a source, a rescan never logs the same email twice.
   - Rejection: status Rejected.
   - Interview invitation or scheduling: status Interview (Screening for a first recruiter call), with the date and time in the note.
   - Offer: status Offer.
   - Acknowledgement, assessment or anything else: a note, no status.
   Clear cases move the card on their own (Ed's rule). Anything ambiguous: change nothing and list it for Ed.
4. If a move is refused by the lifecycle (transition_not_allowed), don't force it: list it for Ed.
5. Never reply to, send or delete email.
6. Finish with a short table for Ed: company, role, what the email said, and what you changed. Put anything that needs his decision at the top.
