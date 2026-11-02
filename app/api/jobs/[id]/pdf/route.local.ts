import fs from "node:fs/promises"
import path from "node:path"

import { type IdContext, respond } from "@/lib/jobhunt/http"
import { buildApplicationPdf, parsePdfOptions } from "@/lib/jobhunt/pdf"
import { jobhuntDir } from "@/lib/jobhunt/store"

/** Builds a PDF. Body: { kind: "letter" | "application", coverLetter?, portfolio? } */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  return respond(() =>
    buildApplicationPdf(id, new URL(request.url).origin, parsePdfOptions(body))
  )
}

/** Serves a built PDF: ?name=<file>, else the most recently built one */
export async function GET(request: Request, { params }: IdContext) {
  const { id } = await params
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) return new Response("Not found", { status: 404 })
  const dir = path.join(jobhuntDir(), "output", id)
  const files = (await fs.readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".pdf"))
  const wanted = new URL(request.url).searchParams.get("name")

  let pdf: string | undefined
  if (wanted) {
    // Only names that are actually in this opportunity's output folder
    pdf = files.find((f) => f === wanted)
  } else {
    const dated = await Promise.all(
      files.map(async (f) => ({ f, mtime: (await fs.stat(path.join(dir, f))).mtimeMs }))
    )
    pdf = dated.sort((a, b) => b.mtime - a.mtime)[0]?.f
  }
  if (!pdf) return new Response("No PDF built yet", { status: 404 })

  return new Response(new Uint8Array(await fs.readFile(path.join(dir, pdf))), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf}"`,
    },
  })
}
