// Builds the PDFs for one application, printed from the running local server
// (`npm run local`) so they use the site's own components, fonts and print theme:
//   letter       the cover letter on its own
//   application  the CV, optionally with the cover letter in front and the
//                portfolio behind
import fs from "node:fs/promises"
import path from "node:path"

import { getSite } from "../content"
import { launchBrowser, mergePdfs, printPage } from "../pdf.mjs"
import { getOpportunity, jobhuntDir } from "./store"

export interface PdfOptions {
  kind: "letter" | "application"
  coverLetter?: boolean
  portfolio?: boolean
}

export interface BuiltPdf {
  file: string
  name: string
  letterPages: number
  cvPages: number
  portfolioPages: number
}

export function parsePdfOptions(body: unknown): PdfOptions {
  const input = (body ?? {}) as Record<string, unknown>
  return {
    kind: input.kind === "letter" ? "letter" : "application",
    coverLetter: input.coverLetter !== false,
    portfolio: input.portfolio === true,
  }
}

/** baseUrl: the local server's origin, e.g. http://127.0.0.1:3000 */
export async function buildApplicationPdf(
  id: string,
  baseUrl: string,
  options: PdfOptions = { kind: "application", coverLetter: true }
): Promise<BuiltPdf> {
  const { opportunity } = await getOpportunity(id)
  const site = await getSite()

  const parts: { key: "letter" | "cv" | "portfolio"; route: string }[] = []
  if (options.kind === "letter" || options.coverLetter) {
    parts.push({ key: "letter", route: `/jobs/${id}/letter` })
  }
  if (options.kind === "application") {
    parts.push({ key: "cv", route: "/cv" })
    if (options.portfolio) parts.push({ key: "portfolio", route: "/portfolio/print" })
  }

  const browser = await launchBrowser()
  let printed: Uint8Array[]
  try {
    printed = []
    for (const part of parts) printed.push(await printPage(browser, `${baseUrl}${part.route}`))
  } finally {
    await browser.close()
  }

  const label =
    options.kind === "letter"
      ? "cover letter"
      : options.coverLetter
        ? "application"
        : "CV"
  const { bytes, pages } = await mergePdfs(printed, {
    title: `${site.name}: ${label} for ${opportunity.company}`,
    author: site.name,
  })
  const count = (key: string) => pages[parts.findIndex((p) => p.key === key)] ?? 0

  const prefix = path.basename(site.cvPdf, ".pdf").replace(/_CV$/, "")
  const company = opportunity.company.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")
  const suffix =
    options.kind === "letter"
      ? "Cover_Letter"
      : `${options.coverLetter ? "Application" : "CV"}${options.portfolio ? "_with_Portfolio" : ""}`
  const name = `${prefix}_${company}_${suffix}.pdf`
  const dir = path.join(jobhuntDir(), "output", id)
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, name)
  await fs.writeFile(file, bytes)

  return {
    file,
    name,
    letterPages: count("letter"),
    cvPages: count("cv"),
    portfolioPages: count("portfolio"),
  }
}
