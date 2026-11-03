# CV platform

A programmatic CV: one set of Markdown files drives a website and a print-ready PDF, plus a local-only job hunt tracker with an MCP server, so an AI agent can work with your applications.

The stack is public. Your data isn't: it lives in a separate private repo cloned into `data/`. A fresh clone runs on the sample person in `data.example/`.

## Quick start

```bash
npm install
python -m venv backend/.venv
backend/.venv/Scripts/pip install -r backend/requirements.txt   # bin/pip on macOS/Linux
npm run local
```

Open http://127.0.0.1:3030 for the CV and http://127.0.0.1:3030/jobs for the job hunt. With no `data/` folder it uses `data.example/` and says so.

Or run the whole local stack in Docker: `docker compose up --build` (same ports, all bound to 127.0.0.1, `data/` mounted).

## Use your own data

Create a **private** repo with this layout (copy `data.example/` to start) and clone it into `data/`:

```
cv/                     everything the public CV shows
  site.md                 name, headline, contacts, relocation line, links
  about.md  skills.md  certifications.md
  experience/*.md  projects/*.md  education/*.md  hobbies/*.md
  media/                  headshot and images (synced into public/media)
jobhunt/                never published
  opportunities/<id>/
    opportunity.json      listing + application status and timeline
    jd.md                 job description
    letter.md             cover letter: private notes above ---, letter below
    notes.md              interview prep
  output/                 generated application PDFs (ignore it in that repo)
```

`data/` is git-ignored here, so nothing personal can be committed to this repo.

## Modes

| | `npm run build` | `npm run local` |
|---|---|---|
| Output | static export in `out/` | dev server on 127.0.0.1 |
| Pages | `/`, `/cv` | also `/jobs`, `/jobs/[id]`, `/jobs/companies`, `/jobs/new` |
| Backend | none | Flask on :5400 (proxied at `/api/actions/*`), MCP on :5401 |
| Data | `data/`, or `CV_DATA_DIR=data.example` | `data/`, falling back to `data.example/` |

Other scripts:

- `npm run cv:pdf` renders `/cv` from `out/` to the CV PDF (run after `npm run build`).
- `npm run application` builds cover letter + CV PDFs into `data/jobhunt/output/` (needs `npm run local`).
- `npm run check-export` fails if anything from the job hunt reached `out/`.

## Backend and MCP

The job hunt backend is a small Flask app in `backend/`, laid out the way DevTools reads services: each service folder (`jobs/`, `cv/`, `pay/`) has a `map.py` listing its actions, and `jobs/processes.py` holds the application lifecycle (Shortlisted → Applied → Interview → Offer → Accepted, and so on). Every call goes through one pipeline that validates the payload, enforces the lifecycle and runs the handler:

- `POST /api/actions/<name>`, e.g. `jobs.move {id, column}`; `GET /api/actions` lists every action with its schema
- `GET /api/process/definitions` returns the lifecycle; `GET /api/pdf/<id>?name=` serves a built PDF

The MCP server (`backend/mcp_server.py`) exposes the same actions as tools (`jobs.move` → `jobs_move`). With `npm run local` running, connect any MCP client to `http://127.0.0.1:5401/mcp`. For Claude Code:

```bash
claude mcp add --transport http cv http://127.0.0.1:5401/mcp
```

For stdio-only clients: `backend/.venv/Scripts/python backend/mcp_server.py --stdio`.

Tools: `jobs_list`, `jobs_get`, `jobs_add` (refuses duplicates), `jobs_update`, `jobs_move`, `jobs_log_event` (an email `source` is logged once), `jobs_get_letter`, `jobs_set_letter`, `jobs_set_document`, `jobs_build_pdf`, `jobs_stats`, `jobs_version`, `cv_list_sections`, `cv_get_section`, `cv_update_section`, and for agents: `jobs_letter_brief`, `jobs_next_to_apply`, `jobs_application_packet`, `jobs_record_application`, `jobs_find_by_email`.

Prompts (the agent workflows, in `backend/prompts/`): `draft_cover_letter`, `apply_to_job` (one job at a time, the owner confirms every submit; never creates accounts or enters passwords), `triage_inbox` (reads replies through the agent's own email connector and logs them; clear ones move the card, ambiguous ones are listed). Resources: `jobs://profile`, `jobs://letter-rules`, `jobs://job/{id}`, `cv://section/{name}`.

The agents read two private files in the data repo: `jobhunt/profile.md` (standard application answers: work authorisation, notice period, salary expectations by country; a blank value means ask, never guess) and `jobhunt/letter-rules.md` (how the letters are written). `data.example/jobhunt/` has samples of both.

The `pay` service grades each job's salary against Ed's current job (A to D) from data in `data/jobhunt/pay/`: a baseline, grading settings, exchange rates, and one file per country (tax model, average wage, Blue Card minimums) and per city (cost of living, housing, wages), every figure with its source and date. `data.example/jobhunt/pay/` has a made-up baseline and three sample cities.

Every write is validated, locked per opportunity and written atomically. The job hunt is a live local board: `data/jobhunt/` is git-ignored in the data repo too, and nothing in the backend commits or pushes. Tests: `cd backend && .venv/Scripts/python -m unittest discover -s tests`.

## Job hunt Local Instance

1. **File naming.** Job hunt pages and the request guard are `*.local.tsx` / `*.local.ts`. Next only treats them as routes when `CV_MODE=local`, so the static export can't contain them.
2. **Separate backend.** Only the Flask backend in `backend/` reads or writes `data/jobhunt`, and it never runs in the public build. `lib/content` refuses to read outside `data/cv`.
3. **Import boundary.** ESLint blocks importing the job hunt from anything outside `app/jobs`, `lib/jobhunt` (board types and constants), `lib/backend.ts` and `scripts/`.
4. **CI.** The Pages workflow checks out only the data repo's `cv/` folder, and `check-export` scans `out/` before deploying.
5. **Local requests only.** `proxy.local.ts` rejects requests whose Host or Origin isn't this machine, so web pages can't reach the API or MCP server.

## Publishing (GitHub Pages)

`.github/workflows/pages.yml` builds on every push, daily, and when the data repo sends a `cv-data-updated` dispatch. In Settings → Secrets and variables → Actions:

- secret `CV_DATA_DEPLOY_KEY`: the private half of a **read-only** deploy key added to your data repo
- variable `CV_DATA_REPO`: `owner/name` of your data repo
- variable `CV_BASE_PATH`: `/<repo>` while the site is at `<user>.github.io/<repo>`; leave unset with a custom domain
- variable `CV_DATA_DIR`: `data.example` to publish the sample data instead (forks)

Without a deploy key or `CV_DATA_DIR`, the build fails instead of publishing sample data.
