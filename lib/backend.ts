// The Flask backend that owns the job hunt (local mode only). Server code calls
// it directly; the browser goes through the same-origin rewrites in next.config.
export const BACKEND_URL = process.env.CV_API_URL ?? "http://127.0.0.1:5400"

export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

/** POST /api/actions/<name> from server code */
export async function callAction<T>(
  name: string,
  body: object = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/actions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok)
    throw new BackendError(
      data.error ?? `${name} failed (${res.status})`,
      res.status
    )
  return data as T
}
