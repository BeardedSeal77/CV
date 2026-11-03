// `npm run local`: the full stack on this machine, bound to 127.0.0.1 only.
// CV site, print CV and the job hunt (/jobs), plus the Flask backend
// (backend/app.py, :5400) and its MCP server (backend/mcp_server.py, :5401)
// when backend/.venv exists.
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

process.env.CV_MODE = "local"
const port = process.env.PORT ?? "3030"

process.env.CV_WEB_URL ??= `http://127.0.0.1:${port}`

const children = []
function start(command, args, options = {}) {
  const child = spawn(command, args, { stdio: "inherit", env: process.env, ...options })
  children.push(child)
  return child
}
process.on("exit", () => children.forEach((c) => c.kill()))
process.on("SIGINT", () => process.exit(0))

const python = path.join("backend", ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python")
if (fs.existsSync(python)) {
  start(path.resolve(python), ["app.py"], { cwd: "backend" })
  start(path.resolve(python), ["mcp_server.py"], { cwd: "backend" })
  console.log("Backend: http://127.0.0.1:5400/api   MCP: http://127.0.0.1:5401/mcp")
} else {
  console.warn("backend/.venv not found: the job hunt backend isn't running (see README).")
}

const { watchMedia } = await import("./sync-media.mjs")
watchMedia()
console.log(`Job hunt: http://127.0.0.1:${port}/jobs`)

const web = start("npx", ["next", "dev", "-H", "127.0.0.1", "-p", port], {
  shell: process.platform === "win32",
})
web.on("exit", (code) => process.exit(code ?? 0))
