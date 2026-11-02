// The only code that reads or writes data/jobhunt. The UI's API routes and the
// MCP server both go through it, so every write is validated, locked and atomic.
import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

import { dataDir } from "../data-dir.mjs"
import {
  type DocName,
  type JobEvent,
  type Listing,
  type ListingPatch,
  type Opportunity,
  type Status,
  EventSchema,
  ListingPatchSchema,
  ListingSchema,
  OPPORTUNITY_ID,
  OpportunitySchema,
} from "./schema"

const DOC_FILES: Record<DocName, string> = {
  jd: "jd.md",
  letter: "letter.md",
  notes: "notes.md",
}

/** The job hunt must never load in the public build */
function assertLocal() {
  if (process.env.CV_MODE !== "local") {
    throw new Error("The job hunt is only available in local mode (CV_MODE=local).")
  }
}

export function jobhuntDir() {
  assertLocal()
  return path.join(dataDir(), "jobhunt")
}

function opportunitiesDir() {
  return path.join(jobhuntDir(), "opportunities")
}

function oppDir(id: string) {
  if (!OPPORTUNITY_ID.test(id)) throw new Error(`Invalid opportunity id: ${id}`)
  return path.join(opportunitiesDir(), id)
}

export function today() {
  const d = new Date()
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => String(n).padStart(i ? 2 : 4, "0"))
    .join("-")
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Temp file + rename, retrying while Windows holds the target open */
async function writeAtomic(file: string, content: string) {
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  await fs.writeFile(tmp, content, "utf8")
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(tmp, file)
      return
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (attempt >= 20 || !["EPERM", "EBUSY", "EACCES"].includes(code ?? "")) {
        await fs.rm(tmp, { force: true })
        throw err
      }
      await sleep(50 * (attempt + 1))
    }
  }
}

/**
 * Serialises writes to one opportunity across processes (the Next server and a
 * stdio MCP server can run at once), so read-modify-write never loses an update.
 */
async function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const lock = path.join(oppDir(id), ".lock")
  for (let attempt = 0; ; attempt++) {
    try {
      const handle = await fs.open(lock, "wx")
      await handle.close()
      break
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err
      const stat = await fs.stat(lock).catch(() => null)
      if (stat && Date.now() - stat.mtimeMs > 30_000) {
        await fs.rm(lock, { force: true }) // left behind by a crashed writer
        continue
      }
      if (attempt >= 100) throw new Error(`Timed out waiting to write ${id}`)
      await sleep(50)
    }
  }
  try {
    return await fn()
  } finally {
    await fs.rm(lock, { force: true })
  }
}

/** CV_AUTOCOMMIT=1 commits each change to the data repo */
function autocommit(message: string, files: string[]) {
  if (process.env.CV_AUTOCOMMIT !== "1") return
  const repo = dataDir()
  if (!existsSync(path.join(repo, ".git"))) return
  const rel = files.map((f) => path.relative(repo, f))
  execFile("git", ["-C", repo, "add", "--", ...rel], (addErr) => {
    if (addErr) return console.warn("Autocommit failed:", addErr.message)
    execFile("git", ["-C", repo, "commit", "-m", message, "--", ...rel], (err) => {
      if (err) console.warn("Autocommit failed:", err.message)
    })
  })
}

async function readJson(id: string): Promise<Opportunity> {
  const raw = await fs.readFile(path.join(oppDir(id), "opportunity.json"), "utf8")
  return OpportunitySchema.parse(JSON.parse(raw))
}

async function writeJson(opp: Opportunity) {
  const valid = OpportunitySchema.parse(opp)
  const file = path.join(oppDir(valid.id), "opportunity.json")
  await writeAtomic(file, JSON.stringify(valid, null, 2) + "\n")
  return file
}

async function readDoc(id: string, doc: DocName) {
  try {
    return await fs.readFile(path.join(oppDir(id), DOC_FILES[doc]), "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return ""
    throw err
  }
}

export async function listOpportunities(): Promise<Opportunity[]> {
  const dir = opportunitiesDir()
  if (!existsSync(dir)) return []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const ids = entries.filter((e) => e.isDirectory() && OPPORTUNITY_ID.test(e.name))
  const opps = await Promise.all(
    ids.map((e) =>
      readJson(e.name).catch((err) => {
        console.warn(`Skipping ${e.name}: ${err.message}`)
        return null
      })
    )
  )
  return opps.filter((o): o is Opportunity => o !== null)
}

export async function opportunityExists(id: string) {
  return OPPORTUNITY_ID.test(id) && existsSync(path.join(oppDir(id), "opportunity.json"))
}

export async function getOpportunity(id: string) {
  const opportunity = await readJson(id)
  const [jd, letter, notes] = await Promise.all([
    readDoc(id, "jd"),
    readDoc(id, "letter"),
    readDoc(id, "notes"),
  ])
  return { opportunity, jd, letter, notes }
}

export type OpportunityWithDocs = Awaited<ReturnType<typeof getOpportunity>>

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export async function addOpportunity(
  input: Partial<Listing> & { company: string; role: string; jd?: string; letter?: string; id?: string }
) {
  const listing = ListingSchema.parse({ ...input, added: input.added || today() })
  let id = input.id ?? slugify(`${listing.company}-${listing.role}`)
  if (!OPPORTUNITY_ID.test(id)) id = `opp-${Date.now()}`
  for (let n = 2; await opportunityExists(id); n++) id = `${id.replace(/-\d+$/, "")}-${n}`
  await fs.mkdir(oppDir(id), { recursive: true })
  const opp: Opportunity = {
    id,
    ...listing,
    application: {
      status: "Shortlisted",
      updated: today(),
      events: [{ date: today(), status: "Shortlisted", note: "Added." }],
    },
  }
  return withLock(id, async () => {
    const files = [await writeJson(opp)]
    if (input.jd?.trim()) files.push(await writeDocFile(id, "jd", input.jd))
    if (input.letter?.trim()) files.push(await writeDocFile(id, "letter", input.letter))
    autocommit(`jobs: add ${id}`, files)
    return opp
  })
}

export async function updateListing(id: string, patch: ListingPatch) {
  const changes = ListingPatchSchema.parse(patch)
  return withLock(id, async () => {
    const opp = { ...(await readJson(id)), ...changes }
    const file = await writeJson(opp)
    autocommit(`jobs: update ${id}`, [file])
    return opp
  })
}

export async function logEvent(
  id: string,
  event: { date?: string; status?: Status; note?: string; link?: string }
) {
  const ev: JobEvent = EventSchema.parse({ ...event, date: event.date || today() })
  if (!ev.status && !ev.note.trim()) throw new Error("An event needs a note or a status.")
  return withLock(id, async () => {
    const opp = await readJson(id)
    opp.application.events.push(ev)
    if (ev.status) opp.application.status = ev.status
    opp.application.updated = today()
    const file = await writeJson(opp)
    autocommit(`jobs: ${id}${ev.status ? ` → ${ev.status}` : ": note"}`, [file])
    return opp
  })
}

async function writeDocFile(id: string, doc: DocName, text: string) {
  const file = path.join(oppDir(id), DOC_FILES[doc])
  await writeAtomic(file, text.replace(/\r\n/g, "\n").trimEnd() + "\n")
  return file
}

export async function setDoc(id: string, doc: DocName, text: string) {
  if (!(await opportunityExists(id))) throw new Error(`No opportunity ${id}`)
  return withLock(id, async () => {
    const file = await writeDocFile(id, doc, text)
    autocommit(`jobs: ${id} ${doc}`, [file])
  })
}
