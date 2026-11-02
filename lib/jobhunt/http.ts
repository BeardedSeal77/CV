// Shared helpers for the local-only job hunt API routes
import { NextResponse } from "next/server"
import { ZodError } from "zod"

export async function respond(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn())
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues.map((i) => i.message).join("; ") }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : String(err)
    const status = /ENOENT|No opportunity/.test(message) ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export type IdContext = { params: Promise<{ id: string }> }
