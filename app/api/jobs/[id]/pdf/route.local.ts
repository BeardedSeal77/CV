import fs from "node:fs/promises"
import path from "node:path"

import { type IdContext, respond } from "@/lib/jobhunt/http"
import { buildApplicationPdf } from "@/lib/jobhunt/pdf"
import { jobhuntDir } from "@/lib/jobhunt/store"

/** Builds the letter + CV PDF */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params
  return respond(() => buildApplicationPdf(id, new URL(request.url).origin))
}

/** Serves the most recently built PDF for this opportunity */
export async function GET(_request: Request, { params }: IdContext) {
  const { id } = await params
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) return new Response("Not found", { status: 404 })
  const dir = path.join(jobhuntDir(), "output", id)
  const files = await fs.readdir(dir).catch(() => [] as string[])
  const pdf = files.find((f) => f.endsWith(".pdf"))
  if (!pdf) return new Response("No PDF built yet", { status: 404 })
  return new Response(new Uint8Array(await fs.readFile(path.join(dir, pdf))), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf}"`,
    },
  })
}
