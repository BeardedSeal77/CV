// Builds cover letter + CV PDFs through the Flask backend: `npm run application`.
//   npm run application            pick from jobs that have a letter
//   npm run application -- <id>    build one
//   npm run application -- --all   build every job with a letter
// Needs `npm run local` running (CV_API_URL overrides http://127.0.0.1:5400).
import readline from "node:readline/promises"

const base = process.env.CV_API_URL ?? "http://127.0.0.1:5400"

async function action(name, payload = {}) {
  let res
  try {
    res = await fetch(`${base}/api/actions/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(`Can't reach ${base}. Start the local stack with \`npm run local\` first.`)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `${name} failed (${res.status})`)
  return data
}

const { jobs } = await action("jobs.list", { include_archived: true })
const withLetters = jobs.filter((job) => job.hasLetter)
if (!withLetters.length) throw new Error("No job has a cover letter yet.")

const arg = process.argv[2]
let chosen
if (arg === "--all") chosen = withLetters
else if (arg) {
  chosen = withLetters.filter((o) => o.id === arg)
  if (!chosen.length) throw new Error(`No letter for ${arg}. Have: ${withLetters.map((o) => o.id).join(", ")}`)
} else {
  withLetters.forEach((o, i) => console.log(`  ${i + 1}. ${o.company}: ${o.role}  [${o.status}]`))
  console.log("  a. All of them")
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  for (;;) {
    const answer = (await rl.question("Build which one? ")).trim().toLowerCase()
    if (answer === "a") chosen = withLetters
    else if (/^\d+$/.test(answer) && withLetters[Number(answer) - 1]) chosen = [withLetters[Number(answer) - 1]]
    if (chosen) break
    console.log(`Enter a number from 1 to ${withLetters.length}, or a.`)
  }
  rl.close()
}

for (const job of chosen) {
  const result = await action("jobs.build_pdf", { id: job.id })
  console.log(`Built ${result.file}`)
}
