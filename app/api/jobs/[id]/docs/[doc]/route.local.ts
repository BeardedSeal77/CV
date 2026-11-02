import { respond } from "@/lib/jobhunt/http"
import { DOCS, type DocName } from "@/lib/jobhunt/schema"
import { setDoc } from "@/lib/jobhunt/store"

/** Body: { text } replaces jd.md, letter.md or notes.md */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; doc: string }> }
) {
  const { id, doc } = await params
  return respond(async () => {
    if (!DOCS.includes(doc as DocName)) throw new Error(`Unknown document: ${doc}`)
    const { text } = await request.json()
    if (typeof text !== "string") throw new Error("Body must be { text: string }")
    await setDoc(id, doc as DocName, text)
    return { ok: true }
  })
}
