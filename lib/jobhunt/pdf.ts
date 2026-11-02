// Builds one application PDF: the cover letter page followed by the CV.
// Both pages are printed from the running local server (`npm run local`), so they
// use the site's own fonts and print styles.
import fs from "node:fs/promises"
import path from "node:path"

import { PDFDocument } from "pdf-lib"
import { type Browser, chromium } from "playwright-core"

import { getSite } from "../content"
import { getOpportunity, jobhuntDir } from "./store"

async function launch(): Promise<Browser> {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel })
    } catch {}
  }
  throw new Error("No Chrome or Edge installation found to print the PDF.")
}

async function printPage(browser: Browser, url: string) {
  const page = await browser.newPage({ colorScheme: "light" })
  try {
    const response = await page.goto(url, { waitUntil: "networkidle" })
    if (!response?.ok()) throw new Error(`${url} returned ${response?.status()}`)
    await page.emulateMedia({ media: "print" })
    await page.evaluate(() => document.fonts.ready)
    return await page.pdf({ preferCSSPageSize: true, printBackground: true })
  } finally {
    await page.close()
  }
}

export interface BuiltPdf {
  file: string
  letterPages: number
  cvPages: number
}

/** baseUrl: the local server's origin, e.g. http://127.0.0.1:3000 */
export async function buildApplicationPdf(id: string, baseUrl: string): Promise<BuiltPdf> {
  const { opportunity } = await getOpportunity(id)
  const site = await getSite()
  const browser = await launch()
  let letterPdf: Uint8Array, cvPdf: Uint8Array
  try {
    letterPdf = await printPage(browser, `${baseUrl}/jobs/${id}/letter`)
    cvPdf = await printPage(browser, `${baseUrl}/cv`)
  } finally {
    await browser.close()
  }

  const merged = await PDFDocument.create()
  const letter = await PDFDocument.load(letterPdf)
  const cv = await PDFDocument.load(cvPdf)
  for (const doc of [letter, cv]) {
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  merged.setTitle(`${site.name}: application to ${opportunity.company}`)
  merged.setAuthor(site.name)

  const prefix = path.basename(site.cvPdf, ".pdf").replace(/_CV$/, "")
  const company = opportunity.company.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "")
  const dir = path.join(jobhuntDir(), "output", id)
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, `${prefix}_${company}_Application.pdf`)
  await fs.writeFile(file, await merged.save())
  return { file, letterPages: letter.getPageCount(), cvPages: cv.getPageCount() }
}
