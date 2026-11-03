// Local mode only (a *.local.ts file): binding to 127.0.0.1 doesn't stop a web
// page you visit from sending requests here, via DNS rebinding or a cross-site
// form post. Reject anything whose Host or Origin isn't this machine.
import { type NextRequest, NextResponse } from "next/server"

// Plus any names in CV_ALLOWED_HOSTS, e.g. the compose service names in Docker
const LOCAL_HOSTS = new Set([
  "127.0.0.1",
  "localhost",
  "[::1]",
  ...(process.env.CV_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
])

function hostname(value: string) {
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname
  } catch {
    return ""
  }
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const origin = request.headers.get("origin")
  const hostOk = LOCAL_HOSTS.has(hostname(host))
  const originOk = !origin || LOCAL_HOSTS.has(hostname(origin))
  if (!hostOk || !originOk) {
    return new NextResponse("Forbidden: this server only accepts local requests.", {
      status: 403,
    })
  }
  return NextResponse.next()
}

// With the custom *.local.ts extension Next resolves this file through its
// middleware loader, which looks for a default export.
export default proxy
