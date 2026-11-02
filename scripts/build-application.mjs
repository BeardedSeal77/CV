// Builds cover letter + CV PDFs through the local server: `npm run application`.
//   npm run application            pick from opportunities that have a letter
//   npm run application -- <id>    build one
//   npm run application -- --all   build every opportunity with a letter
// Needs `npm run local` running (CV_LOCAL_URL overrides http://127.0.0.1:3000).
import readline from "node:readline/promises"

const base = process.env.CV_LOCAL_URL ?? "http://127.0.0.1:3000"

async function api(path, method = "GET") {
  let res
  try {
    res = await fetch(`${base}${path}`, { method })
  } catch {
    throw new Error(`Can't reach ${base}. Start the local stack with \`npm run local\` first.`)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `${path} failed (${res.status})`)
  return data
}

const { opportunities } = await api("/api/jobs")
const withLetters = []
for (const opp of opportunities) {
  const full = await api(`/api/jobs/${opp.id}`)
  if (full.letter.trim()) withLetters.push(opp)
}
if (!withLetters.length) throw new Error("No opportunity has a cover letter yet.")

const arg = process.argv[2]
let chosen
if (arg === "--all") chosen = withLetters
else if (arg) {
  chosen = withLetters.filter((o) => o.id === arg)
  if (!chosen.length) throw new Error(`No letter for ${arg}. Have: ${withLetters.map((o) => o.id).join(", ")}`)
} else {
  withLetters.forEach((o, i) => console.log(`  ${i + 1}. ${o.company}: ${o.role}  [${o.application.status}]`))
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

for (const opp of chosen) {
  const result = await api(`/api/jobs/${opp.id}/pdf`, "POST")
  console.log(`Built ${result.file}`)
}
