---
description: Draft (or redraft) the cover letter for one job on Ed's board.
arguments:
  job_id: The job's id on the board, e.g. aerones-ai. Leave empty to take the first job in the apply queue that needs a letter.
---
Draft the cover letter for job {job_id}.

1. If no job id is given, call jobs_next_to_apply and take the first job under "needs_letter".
2. Call jobs_letter_brief with the job's id. It returns the job and its description, the whole CV, the letter rules, the applicant profile and up to three of Ed's earlier letters.
3. Write the letter by the rules in the brief. Match the voice of the example letters. Use facts from the CV only: never invent experience, numbers, tools or results. Use something specific from this job's description.
4. Save it with jobs_set_letter: the letter as `text`, and short prep notes (apply link, pay, gaps to be ready for) as `notes`.
5. Move the job to Ready: jobs_move with column "backlog" and status "Ready".
6. Check it fits one page: jobs_build_pdf with kind "letter". If it's refused for overflowing, shorten the letter and save again.
7. Show Ed the letter and say what you led with and why.
