import type { NextConfig } from "next"

// GitHub Pages project site: served at https://<user>.github.io/CV/
// Applied only to production builds so `next dev` serves at the root.
// If the repo is ever renamed (or moved to <user>.github.io root), update BASE_PATH.
const BASE_PATH = process.env.NODE_ENV === "production" ? "/CV" : ""

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
}

export default nextConfig
