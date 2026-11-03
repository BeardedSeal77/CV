# Cover letter rules

## Shape
- One A4 page: 250 to 350 words. The PDF builder refuses a letter that overflows the page.
- Above a `---` line: private prep notes (apply link, pay, gaps to be ready for). Only the part below `---` is printed.
- Below it, in this order, blocks separated by blank lines:
  1. Name line: `Sam Example`
  2. Contact line, parts separated by a middle dot (U+00B7): `Utrecht, Netherlands · <email> · <phone> · <website without https://>` (take them from the profile's contact)
  3. Date: e.g. `3 November 2026`
  4. Salutation: the recruiter by first name when the ad names one, otherwise `Dear <Company> hiring team,`
  5. Three or four short paragraphs
  6. The relocation paragraph (below)
  7. `Kind regards,` then `Sam Example` on the next line

## Content
- Open with the role and, in one sentence, why it fits.
- Lead with the proof closest to the ad (the projects and roles on the CV).
- Facts only from the CV. Never invent experience, numbers, tools or results.
- When the ad leans on something Ed lacks, name it in one honest line rather than hiding it.
- Use something specific from the job description, so the letter can't be sent anywhere else.
- Plain English, short sentences. No "thrilled", "passionate", "excited", no buzzwords.

## Closing paragraph (always)
`(Any work-authorisation line the applicant needs.)` Then: `My notice period is one month.`

## After drafting
- Save it with jobs.set_letter, keeping the prep notes.
- Move the job to Ready (jobs.move, column backlog, status Ready).
- Build the letter PDF (jobs.build_pdf with kind "letter") to check it fits one page.
