---
description: Apply for one job on Ed's behalf, from his board, with his confirmation before submitting.
arguments:
  job_id: The job's id on the board. Leave empty to take the first job in the apply queue.
---
Apply for job {job_id} on Ed's behalf. One job at a time: Ed confirms every submit.

1. If no job id is given, call jobs_next_to_apply and take the first job under "ready". If only "needs_letter" has jobs, draft that job's letter first (the draft_cover_letter steps), then come back.
2. Call jobs_application_packet with the job's id. It returns where to apply (apply_at, or apply_email for email applications), the applicant profile, the letter text, the pay check (the city's targets and Blue Card minimum) and the PDFs, up to date: cv, letter and application (letter then CV in one file); pass portfolio: true for the portfolio kinds too.
3. Open apply_at in the browser. If the site needs an account, a login or a CAPTCHA, stop and tell Ed: never create accounts or enter passwords.
4. Fill in the form:
   - contact details from profile.contact;
   - standard questions from the profile (work authorisation, notice period, earliest start, relocation, answers);
   - salary from profile.salary_expectations for the job's country, else the default; keep it above pay_check.blue_card.minimum and at the B target or better where the listed range allows;
   - the cover letter text where the form has a box for it;
   - files: match the form's fields. One file field: application (or application_portfolio if it asks for work samples). A CV field and a separate cover letter or "other documents" field: cv and letter. A portfolio field: portfolio. For each file call jobs_upload_ticket with the job's id, the kind and the form page's origin (e.g. https://kariera.comarch.pl); in the page, fetch the returned url, make a File from the blob with the returned name and type application/pdf, put it in the file input through a DataTransfer, and dispatch input and change events. A ticket works once, for five minutes, from that origin only: ask for a new one if it fails.
   If a question isn't answered by the profile, or a salary is blank, ask Ed. Never invent an answer.
5. Before submitting, show Ed every field you filled and every file you attached, and ask him to confirm. Submit only after he says yes.
6. Once the submit has gone through, call jobs_record_application with the job's id, the method used (files handed over with tickets are listed for you), any salary quoted, and the confirmation link if there is one.
7. If anything went wrong, record it with jobs_log_event (a note, no status) and tell Ed.
