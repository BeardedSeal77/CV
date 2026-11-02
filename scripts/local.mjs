// `npm run local`: the full stack on this machine, bound to 127.0.0.1 only.
// CV site, print CV, job hunt (/jobs), its API and the MCP endpoint (/mcp).
import { spawn } from "node:child_process"

process.env.CV_MODE = "local"
const port = process.env.PORT ?? "3000"

await import("./sync-media.mjs")
console.log(`Job hunt: http://127.0.0.1:${port}/jobs   MCP: http://127.0.0.1:${port}/mcp`)

const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})
child.on("exit", (code) => process.exit(code ?? 0))
