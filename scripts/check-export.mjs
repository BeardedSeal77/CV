// CI guard, run after the static build: fails if anything from the job hunt
// reached out/. The sparse checkout already keeps data/jobhunt off the runner;
// this catches a mistake in the stack itself.
import fs from "node:fs"
import path from "node:path"

const out = path.join(process.cwd(), "out")
if (!fs.existsSync(out)) {
  console.error("out/ not found: run the static build first.")
  process.exit(1)
}

const problems = []
for (const dir of ["jobs", "api", "mcp"]) {
  if (fs.existsSync(path.join(out, dir)) || fs.existsSync(path.join(out, `${dir}.html`))) {
    problems.push(`out/${dir} exists`)
  }
}

// Fingerprints of private content, when the job hunt is present (local runs)
const fingerprints = ['data-private="jobhunt"', "data-private=\\\"jobhunt\\\"", "/api/jobs", "lib/jobhunt"]
const jobsDir = path.join(process.env.CV_DATA_DIR ?? "data", "jobhunt", "opportunities")
if (fs.existsSync(jobsDir)) {
  for (const id of fs.readdirSync(jobsDir)) {
    fingerprints.push(`/jobs/${id}`)
    const letter = path.join(jobsDir, id, "letter.md")
    if (fs.existsSync(letter)) {
      const body = fs.readFileSync(letter, "utf8").split(/^---\s*$/m).pop() ?? ""
      const line = body.split("\n").find((l) => l.trim().length > 60)
      if (line) fingerprints.push(line.trim().slice(0, 60))
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(html|txt|js|json|css|rsc)$/.test(entry.name)) {
      const text = fs.readFileSync(full, "utf8")
      for (const f of fingerprints) {
        if (text.includes(f)) problems.push(`${path.relative(out, full)} contains "${f.slice(0, 40)}"`)
      }
    }
  }
}
walk(out)

if (problems.length) {
  console.error("Job hunt content found in the static export:\n  " + problems.join("\n  "))
  process.exit(1)
}
console.log("check-export: no job hunt content in out/")
