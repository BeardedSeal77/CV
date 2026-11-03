// Copies <data>/cv/media into public/media (git-ignored) so Next serves it.
// Runs before dev, build and local; the media itself lives in the data repo.
// With --watch (used by `npm run local`) it keeps copying files as they change,
// so an edited screenshot shows up without restarting the server.
import fs from "node:fs"
import path from "node:path"

import { cvDir } from "../lib/data-dir.mjs"

const source = path.join(cvDir(), "media")
const target = path.join(process.cwd(), "public", "media")

fs.rmSync(target, { recursive: true, force: true })
if (fs.existsSync(source)) {
  fs.cpSync(source, target, { recursive: true })
  console.log(`Synced media from ${path.relative(process.cwd(), source)}`)
}

export function watchMedia() {
  if (!fs.existsSync(source)) return
  fs.watch(source, { recursive: true }, (_event, name) => {
    if (!name) return
    const from = path.join(source, name)
    const to = path.join(target, name)
    try {
      if (fs.existsSync(from) && fs.statSync(from).isFile()) {
        fs.mkdirSync(path.dirname(to), { recursive: true })
        fs.copyFileSync(from, to)
      } else if (!fs.existsSync(from)) {
        fs.rmSync(to, { force: true })
      }
    } catch {
      // A file mid-save can be briefly unreadable; the next change event copies it
    }
  })
}

if (process.argv.includes("--watch")) watchMedia()
