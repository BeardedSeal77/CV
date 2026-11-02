// Prints the site's document pages (/cv, /portfolio/print, the cover letter) to
// PDF with an installed Chrome or Edge, and merges them. Shared by
// scripts/cv-pdf.mjs (the public build) and the local job hunt.
import { PDFDocument } from "pdf-lib"
import { chromium } from "playwright-core"

/** @returns {Promise<import("playwright-core").Browser>} */
export async function launchBrowser() {
  // Use an installed browser rather than downloading one
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel })
    } catch {}
  }
  throw new Error("No Chrome or Edge installation found to print the PDF.")
}

/**
 * Prints one page in the light print theme. Fixed .print-sheet pages clip, so an
 * overflowing sheet fails rather than shipping cut-off text.
 * @param {import("playwright-core").Browser} browser
 * @param {string} url
 * @returns {Promise<Uint8Array>}
 */
export async function printPage(browser, url) {
  const page = await browser.newPage({ colorScheme: "light" })
  try {
    const response = await page.goto(url, { waitUntil: "networkidle" })
    if (!response?.ok())
      throw new Error(`${url} returned ${response?.status()}`)
    await page.emulateMedia({ media: "print" })
    await page.evaluate(() => document.fonts.ready)

    const overflows = await page.evaluate(() =>
      [...document.querySelectorAll(".print-sheet")].flatMap((sheet, index) => {
        const limit =
          sheet.getBoundingClientRect().bottom -
          parseFloat(getComputedStyle(sheet).paddingBottom)
        const bottom = Math.max(
          ...[...sheet.querySelectorAll("*")].map(
            (el) => el.getBoundingClientRect().bottom
          )
        )
        const overMm = (bottom - limit) / (96 / 25.4)
        return overMm > 0.5
          ? [`page ${index + 1} by ${overMm.toFixed(1)}mm`]
          : []
      })
    )
    if (overflows.length) {
      throw new Error(
        `${new URL(url).pathname} overflows: ${overflows.join(", ")}`
      )
    }

    return await page.pdf({ preferCSSPageSize: true, printBackground: true })
  } finally {
    await page.close()
  }
}

/**
 * Joins PDFs in order.
 * @param {Uint8Array[]} parts
 * @param {{ title?: string, author?: string }} [meta]
 * @returns {Promise<{ bytes: Uint8Array, pages: number[] }>} pages: page count per part
 */
export async function mergePdfs(parts, meta = {}) {
  const merged = await PDFDocument.create()
  const pages = []
  for (const part of parts) {
    const doc = await PDFDocument.load(part)
    const copied = await merged.copyPages(doc, doc.getPageIndices())
    copied.forEach((page) => merged.addPage(page))
    pages.push(doc.getPageCount())
  }
  if (meta.title) merged.setTitle(meta.title)
  if (meta.author) merged.setAuthor(meta.author)
  return { bytes: await merged.save(), pages }
}
