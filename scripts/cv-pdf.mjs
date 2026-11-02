// Renders the /cv page of the static export (out/) to the CV PDF.
// Run after `npm run build`. Writes the PDF into out/ (so the deploy ships it)
// and public/ (git-ignored, so `npm run dev` and `npm run local` can serve it).
import fs from "node:fs"
import http from "node:http"
import path from "node:path"

import matter from "gray-matter"
import { chromium } from "playwright-core"

import { cvDir } from "../lib/data-dir.mjs"

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

const { cvPdf } = matter.read(path.join(cvDir(), "site.md")).data

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

async function launch() {
  // Use an installed browser rather than downloading one
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel })
    } catch {}
  }
  throw new Error("No Chrome or Edge installation found.")
}

const browser = await launch()
try {
  const page = await browser.newPage({ colorScheme: "light" })
  await page.goto(`http://127.0.0.1:${port}${BASE_PATH}/cv`, {
    waitUntil: "networkidle",
  })
  await page.emulateMedia({ media: "print" })
  await page.evaluate(() => document.fonts.ready)

  // Pages are fixed-size sheets that clip; fail rather than ship cut-off text
  const overflows = await page.evaluate(() =>
    [...document.querySelectorAll(".cv-page")].flatMap((sheet, index) => {
      const inner = sheet.lastElementChild
      const limit =
        inner.getBoundingClientRect().bottom -
        parseFloat(getComputedStyle(inner).paddingBottom)
      const bottom = Math.max(
        ...[...inner.querySelectorAll("*")].map(
          (el) => el.getBoundingClientRect().bottom
        )
      )
      const overMm = (bottom - limit) / (96 / 25.4)
      return overMm > 0.5 ? [`page ${index + 1} by ${overMm.toFixed(1)}mm`] : []
    })
  )
  if (overflows.length) {
    throw new Error(`CV content overflows: ${overflows.join(", ")}`)
  }

  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  for (const dir of [outDir, path.join(root, "public")]) {
    fs.writeFileSync(path.join(dir, cvPdf), pdf)
  }
  console.log(`Wrote ${cvPdf} (${(pdf.length / 1024).toFixed(0)} KB)`)
} finally {
  await browser.close()
  server.close()
}
