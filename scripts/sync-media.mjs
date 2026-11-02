// Copies <data>/cv/media into public/media (git-ignored) so Next serves it.
// Runs before dev, build and local; the media itself lives in the data repo.
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
