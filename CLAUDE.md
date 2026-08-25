# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal CV/portfolio site: a single static page built with Next.js (App Router) and shadcn/ui, exported with `output: "export"` and deployed to GitHub Pages at `https://<user>.github.io/CV/`.

**Important (from AGENTS.md):** the Next.js version here (16.x) has breaking changes relative to older training data — APIs, conventions, and file structure may differ. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.

## Commands

```bash
npm run dev        # dev server (serves at root, no basePath)
npm run build      # production static export to out/ (basePath /CV applied)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write on **/*.{ts,tsx}
```

There are no tests. Validate changes with `npm run lint`, `npm run typecheck`, and `npm run build`.

## Architecture

**Content and code are separated.** All CV data lives in `content/` as markdown files with YAML frontmatter; no personal data is hardcoded in components.

- `lib/content.ts` is the single content-loading layer. It reads `content/` with `gray-matter` and converts markdown bodies to HTML via `remark`/`remark-html`. Each section has a typed getter (`getSite`, `getAbout`, `getExperience`, …) returning the interfaces defined in the same file. Collections (`content/experience/`, `content/education/`, `content/projects/`, `content/hobbies/`) are ordered by filename sort — hence the `01-`, `02-` numeric prefixes. Single-file sections (`site.md`, `about.md`, `skills.md`, `certifications.md`) keep their data entirely in frontmatter.
- `app/page.tsx` is the only page. It fetches all content server-side and composes the section components from `components/site/` (hero, about, experience, projects, skills, education, hobbies, footer). Adding a section means: content file(s) + getter/interface in `lib/content.ts` + a component in `components/site/` + wiring it into `page.tsx` and `NAV_SECTIONS`.
- Markdown-derived HTML reaches components as an `html` string rendered with `dangerouslySetInnerHTML`.

**basePath handling** (GitHub Pages project site): `next.config.ts` sets `basePath: "/CV"` in production builds only and mirrors it into `NEXT_PUBLIC_BASE_PATH`. `next/link` and `next/image` handle it automatically, but raw hrefs and image srcs coming from content frontmatter (e.g. `cvPdf`, `headshot`, hobby images) must be wrapped with `withBasePath()` from `lib/paths.ts`. If the repo is renamed, update `BASE_PATH` in `next.config.ts`.

**Theming:** `next-themes` with class-based dark mode via `components/theme-provider.tsx`, which also registers a global "d" hotkey to toggle theme. Tailwind CSS v4 — configuration lives in `app/globals.css` (no tailwind.config file). shadcn/ui primitives are in `components/ui/` (add more with `npx shadcn@latest add <name>`).

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and publishes `out/` to GitHub Pages. The workflow deliberately uses `npm install` rather than `npm ci` (lockfiles written on Windows omit Linux-only optional packages). `public/.nojekyll` is required for Pages to serve `_next/` assets.

## Formatting

Prettier is the source of truth (`.prettierrc`): no semicolons, double quotes, 2-space indent, with `prettier-plugin-tailwindcss` sorting classes (it recognizes the `cn` and `cva` functions). Run `npm run format` rather than hand-formatting.
