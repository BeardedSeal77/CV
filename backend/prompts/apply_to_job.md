---
description: Apply for one job on Ed's behalf, from his board, with his confirmation before submitting.
arguments:
  job_id: The job's id on the board. Leave empty to take the first job in the apply queue.
---
Apply for job {job_id} on Ed's behalf. One job at a time: Ed confirms every submit.

Use Claude in Chrome for the form: the built-in browser can't upload files.

1. If no job id is given, call jobs_next_to_apply and take the first job under "ready". If only "needs_letter" has jobs, draft that job's letter first (the draft_cover_letter steps), then come back.
2. Call jobs_application_packet with the job's id. If it has already_applied (and a warning), stop: tell Ed when and how he applied, and go on only if he says so. Otherwise it gives:
   - where to apply (apply_at, or apply_email for email applications);
   - form_answers: every standard answer in full and in short versions (by character limit) with character counts, plain punctuation only; problems lists blanks to ask Ed about;
   - how_heard (for "How did you hear about us?"), links (CV website, GitHub, LinkedIn, in that order) and salary (text ready to type, e.g. "PLN 16,000 gross per month");
   - the letter text, the pay check (keep any salary above pay_check.blue_card.minimum, at the B target or better where the range allows), and the PDFs: cv, letter and application (letter then CV in one file), with portfolio: true for the portfolio kinds too.
3. Open apply_at. If the site needs an account, a login or a CAPTCHA, stop and tell Ed: never create accounts or enter passwords.
4. Fill in the form:
   - Click into each field and type: setting values directly can look fine and leave the framework's form empty. Read every value back from the page before showing Ed.
   - Use the shortest answer version that fits the field's limit. Never type a slash or typographic quotes and dashes; some forms reject them.
   - Dropdowns are often custom lists: click to open, find the option, click it. Some options open follow-up fields (e.g. "In what way?"), so look at the form again after each choice.
   - Link fields may turn each link into a chip; check for an existing chip before typing a link again.
   - A site may reformat the phone number; that's fine.
   - Files: match the form's fields. One file field: application (or application_portfolio if it asks for work samples). A CV field and a separate cover letter or "other documents" field: cv and letter. A portfolio field: portfolio. To attach one, call jobs_upload_ticket (job id, kind, the form page's origin), fetch the url in the page, make a File from the blob with the returned name and type application/pdf, put it in the file input through a DataTransfer and dispatch input and change events. A ticket works once, for five minutes, from that origin only. If the page can't reach it, stage the file from its upload_path instead.
   If a question isn't answered by the packet, ask Ed. Never invent an answer.
5. Before submitting, show Ed every field you filled and every file you attached. The consent checkbox and the submit button are his: tick and submit only after his explicit yes. A reCAPTCHA challenge is his to solve.
6. After the submit went through, take a screenshot of the result page and read its address and text. Call jobs_record_application with the job's id, the method used, any salary quoted, and the proof: confirmation_url, confirmation_text, reference (any application number) and screenshot (base64 PNG or JPEG). Files handed over with tickets are listed for you.
7. If anything went wrong, record it with jobs_log_event (a note, no status) and tell Ed.
