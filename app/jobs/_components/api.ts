// Calls to the job hunt backend (Flask on :5400, proxied same-origin in local mode)
import type { Status } from "@/lib/jobhunt/schema"

export class ActionError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message)
  }
}

/** POST /api/actions/<name> with a JSON body; errors arrive as {error, code?} */
export async function action<T = unknown>(
  name: string,
  body: object = {}
): Promise<T> {
  const res = await fetch(`/api/actions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok)
    throw new ActionError(
      data.error ?? `${name} failed (${res.status})`,
      data.code
    )
  return data as T
}

export interface Transition {
  action: string
  to: Status
  trigger: string
}

/** Each status's allowed next steps, from the backend's application process */
export type Lifecycle = Partial<Record<Status, Transition[]>>

export async function loadLifecycle(): Promise<Lifecycle> {
  const res = await fetch("/api/process/definitions", { cache: "no-store" })
  const data = await res.json()
  const states = data.application?.states ?? {}
  return Object.fromEntries(
    Object.entries(states).map(([status, state]) => [
      status,
      (state as { transitions: Transition[] }).transitions,
    ])
  )
}

/** "send_offer" -> "Send offer" */
export const actionLabel = (name: string) =>
  name.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
