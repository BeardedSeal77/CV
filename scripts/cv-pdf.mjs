// Renders the document pages of the static export (out/) to PDF: the CV from /cv,
// and the portfolio from /portfolio/print once site.md names its PDF.
// Run after `npm run build`. Writes the PDFs into out/ (so the deploy ships them)
// and public/ (git-ignored, so `npm run dev` and `npm run local` can serve them).
import fs from "node:fs"
import http from "node:http"
import path from "node:path"

import matter from "gray-matter"

import { cvDir } from "../lib/data-dir.mjs"
import { cvKeywords, launchBrowser, printPage, withMeta } from "../lib/pdf.mjs"

const root = process.cwd()
const outDir = path.join(root, "out")
// Same variable next.config.ts reads for the static build
const BASE_PATH = process.env.CV_BASE_PATH ?? ""

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

if (!fs.existsSync(path.join(outDir, "cv.html"))) {
  console.error("out/cv.html not found: run `npm run build` first.")
  process.exit(1)
}

const site = matter.read(path.join(cvDir(), "site.md")).data
const { groups } = matter.read(path.join(cvDir(), "skills.md")).data
const { name, cvPdf, portfolioPdf } = site

// Real metadata only: the keywords are the role and skills the CV itself lists
const meta = {
  author: name,
  subject: `${site.title}: ${site.tagline}`,
  keywords: cvKeywords(site, groups ?? []),
}

const documents = [{ route: "/cv", file: cvPdf, title: `${name}: CV` }]
if (portfolioPdf)
  documents.push({
    route: "/portfolio/print",
    file: portfolioPdf,
    title: `${name}: Portfolio`,
  })

// Static server for out/, mirroring GitHub Pages: /CV/cv -> out/cv.html
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (urlPath.startsWith(BASE_PATH)) urlPath = urlPath.slice(BASE_PATH.length)
  const base = path.join(outDir, path.normalize(urlPath))
  const file = [base, `${base}.html`, path.join(base, "index.html")].find(
    (candidate) =>
      candidate.startsWith(outDir) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
  )
  if (!file) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
  })
  fs.createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const { port } = server.address()

const browser = await launchBrowser()
try {
  for (const { route, file, title } of documents) {
    const printed = await printPage(
      browser,
      `http://127.0.0.1:${port}${BASE_PATH}${route}`
    )
    const pdf = await withMeta(printed, { ...meta, title })
    for (const dir of [outDir, path.join(root, "public")]) {
      fs.writeFileSync(path.join(dir, file), pdf)
    }
    console.log(
      `Wrote ${file} (${(pdf.length / 1024).toFixed(0)} KB) for ${name}`
    )
  }
} finally {
  await browser.close()
  server.close()
}
