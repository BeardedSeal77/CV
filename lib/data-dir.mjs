// Where the personal data lives. Shared by the Next app (via lib/data-dir.d.mts)
// and the Node scripts, so both resolve the same folder.
//
//   CV_DATA_DIR set        -> that folder (e.g. CV_DATA_DIR=data.example)
//   data/cv exists         -> data/ (a checkout of the private data repo)
//   local mode, no data/   -> data.example/, with a warning
//   otherwise              -> error: a public build never falls back silently
import fs from "node:fs"
import path from "node:path"

let warned = false

/** @returns {string} absolute path of the data folder */
export function dataDir() {
  const root = process.cwd()
  if (process.env.CV_DATA_DIR) {
    const dir = path.resolve(root, process.env.CV_DATA_DIR)
    if (!fs.existsSync(path.join(dir, "cv"))) {
      throw new Error(`CV_DATA_DIR=${process.env.CV_DATA_DIR} has no cv/ folder.`)
    }
    return dir
  }
  const data = path.join(root, "data")
  if (fs.existsSync(path.join(data, "cv"))) return data
  if (process.env.CV_MODE === "local") {
    if (!warned) {
      console.warn("data/cv not found: using the sample data in data.example/.")
      warned = true
    }
    return path.join(root, "data.example")
  }
  throw new Error(
    "data/cv not found. Clone your data repo into data/, or set CV_DATA_DIR=data.example to build with the sample data."
  )
}

/** @returns {string} absolute path of the CV content folder */
export function cvDir() {
  return path.join(dataDir(), "cv")
}
