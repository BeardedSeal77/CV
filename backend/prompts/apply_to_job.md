---
description: Apply for one job on Ed's behalf, from his board, with his confirmation before submitting.
arguments:
  job_id: The job's id on the board. Leave empty to take the first job in the apply queue.
---
Apply for job {job_id} on Ed's behalf. One job at a time: Ed confirms every submit.

1. If no job id is given, call jobs_next_to_apply and take the first job under "ready". If only "needs_letter" has jobs, draft that job's letter first (the draft_cover_letter steps), then come back.
2. Call jobs_application_packet with the job's id. It returns where to apply (apply_at, or apply_email for email applications), the applicant profile, the letter text and fresh PDFs. Each file has a path relative to the CV repo root (the folder that holds data/) and a download link on the website.
3. Open apply_at in the browser. If the site needs an account, a login or a CAPTCHA, stop and tell Ed: never create accounts or enter passwords.
4. Fill in the form:
   - contact details from profile.contact;
   - standard questions from the profile (work authorisation, notice period, earliest start, relocation, answers);
   - salary from profile.salary_expectations for the job's country, else the default;
   - the cover letter text where the form has a box for it;
   - files: the combined application PDF when the form takes one file, otherwise the CV and the letter separately.
   If a question isn't answered by the profile, or a salary is blank, ask Ed. Never invent an answer.
5. Before submitting, show Ed every field you filled and every file you attached, and ask him to confirm. Submit only after he says yes.
6. Once the submit has gone through, call jobs_record_application with the job's id, the method used, the names of the files sent, any salary quoted, and the confirmation link if there is one.
7. If anything went wrong, record it with jobs_log_event (a note, no status) and tell Ed.
