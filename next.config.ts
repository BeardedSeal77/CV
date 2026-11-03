import type { NextConfig } from "next"

import { BACKEND_URL } from "./lib/backend"

// Two modes from one codebase:
// - default (CI, `npm run build`): static export of the public CV only.
// - CV_MODE=local (`npm run local`): a server on 127.0.0.1 that also serves the
//   job hunt, its API and the MCP endpoint. Those live in *.local.tsx / *.local.ts
//   files, which Next only treats as pages and routes in local mode, so the
//   static export can never contain them.
const local = process.env.CV_MODE === "local"

// GitHub Pages project sites are served under /<repo>; a custom domain is served
// at the root. Set CV_BASE_PATH (e.g. "/CV") in CI until the domain is live.
const BASE_PATH = local ? "" : (process.env.CV_BASE_PATH ?? "")

// The Flask backend (backend/app.py) behind the job hunt, local mode only. The
// board calls it same-origin; Next forwards these paths to it.
const API_URL = BACKEND_URL

const nextConfig: NextConfig = {
  output: local ? undefined : "export",
  basePath: BASE_PATH,
  pageExtensions: local ? ["local.tsx", "local.ts", "tsx", "ts"] : ["tsx", "ts"],
  images: {
    unoptimized: true,
  },
  ...(local && {
    async rewrites() {
      return [
        { source: "/api/actions/:path*", destination: `${API_URL}/api/actions/:path*` },
        { source: "/api/process/:path*", destination: `${API_URL}/api/process/:path*` },
        { source: "/api/pdf/:path*", destination: `${API_URL}/api/pdf/:path*` },
        // The CV and portfolio PDFs: printed on demand when public/ has no copy
        { source: "/:file([^/]+\\.pdf)", destination: `${API_URL}/api/documents/:file` },
      ]
    },
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
}

export default nextConfig
