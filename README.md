# CV platform

A programmatic CV: one set of Markdown files drives a website and a print-ready PDF, plus a local-only job hunt tracker with an MCP server, so an AI agent can work with your applications.

The stack is public. Your data isn't: it lives in a separate private repo cloned into `data/`. A fresh clone runs on the sample person in `data.example/`.

## Quick start

```bash
npm install
npm run local
```

Open http://127.0.0.1:3000 for the CV and http://127.0.0.1:3000/jobs for the job hunt. With no `data/` folder it uses `data.example/` and says so.

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
| API and MCP | none | `/api/jobs/*`, MCP at `/mcp` |
| Data | `data/`, or `CV_DATA_DIR=data.example` | `data/`, falling back to `data.example/` |

Other scripts:

- `npm run cv:pdf` renders `/cv` from `out/` to the CV PDF (run after `npm run build`).
- `npm run application` builds cover letter + CV PDFs into `data/jobhunt/output/` (needs `npm run local`).
- `npm run mcp:stdio` serves the MCP tools over stdio, for clients that can't connect by URL.
- `npm run check-export` fails if anything from the job hunt reached `out/`.

## MCP

With `npm run local` running, connect any MCP client to `http://127.0.0.1:3000/mcp`. For Claude Code:

```bash
claude mcp add --transport http cv http://127.0.0.1:3000/mcp
```

Tools: `jobs_list`, `jobs_get`, `jobs_add`, `jobs_update`, `jobs_log_event`, `jobs_get_letter`, `jobs_set_letter`, `jobs_build_pdf`, `jobs_stats`, `cv_get_section`, `cv_update_section`. Resources: `cv://site`, `cv://section/{name}`, `jobs://opportunity/{id}`.

Every write is validated (`lib/jobhunt/schema.ts`), locked per opportunity and written atomically. Set `CV_AUTOCOMMIT=1` to commit each change to the data repo.

## Job hunt Local Instance

1. **File naming.** Job hunt pages, API routes, the MCP route and the request guard are `*.local.tsx` / `*.local.ts`. Next only treats them as routes when `CV_MODE=local`, so the static export can't contain them.
2. **Runtime guard.** `lib/jobhunt` throws unless `CV_MODE=local`, and `lib/content` refuses to read outside `data/cv`.
3. **Import boundary.** ESLint blocks importing the job hunt from anything outside `app/jobs`, `app/api`, `app/mcp`, `mcp/`, `lib/jobhunt` and `scripts/`.
4. **CI.** The Pages workflow checks out only the data repo's `cv/` folder, and `check-export` scans `out/` before deploying.
5. **Local requests only.** `proxy.local.ts` rejects requests whose Host or Origin isn't this machine, so web pages can't reach the API or MCP server.

## Publishing (GitHub Pages)

`.github/workflows/pages.yml` builds on every push, daily, and when the data repo sends a `cv-data-updated` dispatch. In Settings → Secrets and variables → Actions:

- secret `CV_DATA_DEPLOY_KEY`: the private half of a **read-only** deploy key added to your data repo
- variable `CV_DATA_REPO`: `owner/name` of your data repo
- variable `CV_BASE_PATH`: `/<repo>` while the site is at `<user>.github.io/<repo>`; leave unset with a custom domain
- variable `CV_DATA_DIR`: `data.example` to publish the sample data instead (forks)

Without a deploy key or `CV_DATA_DIR`, the build fails instead of publishing sample data.
