#!/usr/bin/env node
/**
 * Generates public/ED_Cullen_CV.pdf from the /cv-print route.
 *
 * The route renders the same markdown content the site uses, so the PDF can
 * never drift from content/. A dev server is used on purpose: it serves at the
 * root (no basePath) and does not need a production build, which would
 * otherwise have to embed the very PDF this script is writing.
 *
 * Usage: npm run generate:pdf
 * Requires a Playwright chromium build (`npx playwright install chromium`).
 */

import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)
const PORT = Number(process.env.CV_PDF_PORT ?? 4599)
const PRINT_URL = `http://127.0.0.1:${PORT}/cv-print`
const OUTPUT = path.join(repoRoot, "public", "ED_Cullen_CV.pdf")
const READY_TIMEOUT_MS = 90_000

const isWindows = process.platform === "win32"

function log(message) {
  process.stdout.write(`[generate-cv-pdf] ${message}\n`)
}

function fail(message, error) {
  process.stderr.write(`[generate-cv-pdf] ERROR: ${message}\n`)
  if (error) {
    process.stderr.write(`${error.stack ?? error}\n`)
  }
  process.exitCode = 1
}

function startDevServer() {
  const bin = path.join(
    repoRoot,
    "node_modules",
    ".bin",
    isWindows ? "next.cmd" : "next"
  )

  if (!fs.existsSync(bin)) {
    throw new Error(
      `Next.js CLI not found at ${bin}. Run "npm install" before this script.`
    )
  }

  const child = spawn(bin, ["dev", "--port", String(PORT)], {
    cwd: repoRoot,
    // A detached process group makes it possible to kill the dev server *and*
    // the bundler workers it spawns in one go on POSIX.
    detached: !isWindows,
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT), BROWSER: "none" },
  })

  const output = []
  const capture = (chunk) => {
    const text = chunk.toString()
    output.push(text)
    if (output.length > 200) output.shift()
  }
  child.stdout.on("data", capture)
  child.stderr.on("data", capture)

  return { child, output }
}

function stopDevServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return

  try {
    if (isWindows) {
      // child.kill() only reaches the cmd shim on Windows; taskkill /T takes
      // the whole tree with it.
      spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], {
        stdio: "ignore",
      })
    } else {
      // Negative pid => kill the whole detached process group.
      process.kill(-child.pid, "SIGTERM")
    }
  } catch {
    try {
      child.kill("SIGKILL")
    } catch {
      /* already gone */
    }
  }
}

async function waitForServer(child, output) {
  const deadline = Date.now() + READY_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Dev server exited early (code ${child.exitCode}):\n${output.join("")}`
      )
    }

    try {
      const response = await fetch(PRINT_URL, { cache: "no-store" })
      // Read the body so the dev server finishes the request before we move on.
      await response.text()
      if (response.ok) return
    } catch {
      /* not listening yet */
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(
    `Timed out after ${READY_TIMEOUT_MS / 1000}s waiting for ${PRINT_URL}.\n` +
      output.join("")
  )
}

async function renderPdf() {
  const { chromium } = await import("playwright")

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    // The route's CSS is media-agnostic (the same rules apply on screen and in
    // print), so print emulation only affects @page handling. colorScheme light
    // additionally guards against a system-dark preference reaching the page.
    await page.emulateMedia({ media: "print", colorScheme: "light" })
    await page.goto(PRINT_URL, { waitUntil: "networkidle", timeout: 60_000 })

    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(
        Array.from(document.images)
          .filter((image) => !image.complete)
          .map(
            (image) =>
              new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true })
                image.addEventListener("error", resolve, { once: true })
              })
          )
      )
    })

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
    await page.pdf({
      path: OUTPUT,
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }
}

async function main() {
  let devServer = null

  const cleanup = () => stopDevServer(devServer?.child)
  process.on("exit", cleanup)
  process.on("SIGINT", () => {
    cleanup()
    process.exit(130)
  })
  process.on("SIGTERM", () => {
    cleanup()
    process.exit(143)
  })

  try {
    log(`starting next dev on port ${PORT}`)
    devServer = startDevServer()

    log(`waiting for ${PRINT_URL}`)
    await waitForServer(devServer.child, devServer.output)

    log("rendering PDF")
    await renderPdf()

    log(`wrote ${path.relative(repoRoot, OUTPUT)}`)
  } catch (error) {
    fail(error.message, error)
  } finally {
    cleanup()
  }
}

await main()
