"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { splitLetter } from "@/lib/jobhunt/letter"
import { type DocName, type Opportunity, STATUSES, type Status } from "@/lib/jobhunt/schema"

import { COUNTRY, fmtDate, StatusPill } from "./status"

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const field =
  "w-full min-w-0 rounded-md border bg-background px-2.5 py-1.5 text-sm text-foreground"

function DocEditor({
  id,
  doc,
  label,
  initial,
  rows,
  hint,
  copyText,
}: {
  id: string
  doc: DocName
  label: string
  initial: string
  rows: number
  hint?: string
  copyText?: (text: string) => string
}) {
  const [text, setText] = useState(initial)
  const [state, setState] = useState("")
  const dirty = text !== initial
  async function save() {
    setState("Saving…")
    try {
      await call(`/api/jobs/${id}/docs/${doc}`, "PUT", { text })
      setState("Saved")
    } catch (err) {
      setState((err as Error).message)
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText ? copyText(text) : text)
      setState("Copied")
    } catch {
      setState("Select the text and copy it")
    }
  }
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{state}</span>
          {copyText && (
            <Button variant="outline" size="sm" onClick={copy}>
              Copy letter
            </Button>
          )}
          <Button size="sm" variant={dirty ? "default" : "outline"} onClick={save}>
            Save
          </Button>
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setState("")
        }}
        rows={rows}
        className={`${field} font-mono leading-relaxed`}
      />
    </section>
  )
}

export function OpportunityDetail({
  opportunity: opp,
  jd,
  letter,
  notes,
}: {
  opportunity: Opportunity
  jd: string
  letter: string
  notes: string
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pdfState, setPdfState] = useState<{ busy: boolean; message: string; ready: boolean }>({
    busy: false,
    message: "",
    ready: false,
  })
  const [form, setForm] = useState({ date: todayStr(), status: "", note: "", link: "" })

  async function addEvent(event: { date: string; status?: string; note: string; link?: string }) {
    setError("")
    try {
      await call(`/api/jobs/${opp.id}/events`, "POST", event)
      router.refresh()
      return true
    } catch (err) {
      setError((err as Error).message)
      return false
    }
  }

  async function buildPdf() {
    setPdfState({ busy: true, message: "Building the PDF…", ready: false })
    try {
      const result = await call(`/api/jobs/${opp.id}/pdf`, "POST")
      const warn =
        result.letterPages > 1 ? ` The letter runs to ${result.letterPages} pages; trim it.` : ""
      setPdfState({ busy: false, message: `Built ${result.file}.${warn}`, ready: true })
    } catch (err) {
      setPdfState({ busy: false, message: (err as Error).message, ready: false })
    }
  }

  const facts: [string, React.ReactNode][] = [
    ["Location", [COUNTRY[opp.country] ?? opp.country, opp.city, opp.mode].filter(Boolean).join(" · ")],
    [
      "Listing",
      opp.url ? (
        <a href={opp.url} target="_blank" rel="noreferrer" className="text-primary underline">
          {opp.platform || "Open listing"} ↗
        </a>
      ) : (
        opp.platform
      ),
    ],
    ["Email", opp.email],
    ["Pay", opp.pay],
    ["Fit", opp.fit],
    ["Posted", fmtDate(opp.posted)],
    ["Deadline", fmtDate(opp.deadline)],
    ["Company", [opp.size, opp.what].filter(Boolean).join(" · ")],
    ["Added", fmtDate(opp.added)],
  ]
  const events = [...opp.application.events].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-8">
        <section className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Status
            <select
              value={opp.application.status}
              onChange={(e) =>
                addEvent({
                  date: todayStr(),
                  status: e.target.value,
                  note: `Status set to ${e.target.value}.`,
                })
              }
              className={`${field} w-auto`}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <StatusPill status={opp.application.status} />
        </section>

        <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
          {facts
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
        </dl>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Application PDF</h2>
          <p className="text-sm text-muted-foreground">
            The cover letter page followed by your CV, printed from this server.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={buildPdf} disabled={pdfState.busy}>
              {pdfState.busy ? "Building…" : "Build application PDF"}
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={`/jobs/${opp.id}/letter`} target="_blank" />}>
              Preview letter
            </Button>
            {pdfState.ready && (
              <Button variant="outline" nativeButton={false} render={<a href={`/api/jobs/${opp.id}/pdf`} target="_blank" rel="noreferrer" />}>
                Open PDF
              </Button>
            )}
          </div>
          {pdfState.message && <p className="text-xs break-all text-muted-foreground">{pdfState.message}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <ol className="divide-y text-sm">
            {!events.length && <li className="py-2 text-muted-foreground">No updates yet.</li>}
            {events.map((e, i) => (
              <li key={i} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-2.5">
                <span className="pt-0.5 font-mono text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                <span className="grid gap-1">
                  {e.status && (
                    <span>
                      <StatusPill status={e.status} />
                    </span>
                  )}
                  {e.note && <span>{e.note}</span>}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      Open source ↗
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ol>
          <form
            className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!form.note.trim() && !form.status) return
              const ok = await addEvent({
                date: form.date,
                status: form.status || undefined,
                note: form.note.trim(),
                link: form.link.trim() || undefined,
              })
              if (ok) setForm({ date: todayStr(), status: "", note: "", link: "" })
            }}
          >
            <label className="grid gap-1 text-xs text-muted-foreground">
              Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              New status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status | "" })} className={field}>
                <option value="">No status change</option>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
              Note
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="What happened: email from recruiter, interview booked, assessment sent…"
                className={field}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
              Link
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="Optional: email thread, calendar invite"
                className={field}
              />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" size="sm">
                Add update
              </Button>
              {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
          </form>
        </section>
      </div>

      <div className="space-y-8">
        <DocEditor
          id={opp.id}
          doc="letter"
          label="Cover letter"
          initial={letter}
          rows={22}
          hint="Private prep notes go above the --- line; only the letter below it is printed."
          copyText={(t) => splitLetter(t).letter}
        />
        <DocEditor id={opp.id} doc="jd" label="Job description" initial={jd} rows={10} />
        <DocEditor id={opp.id} doc="notes" label="Prep notes" initial={notes} rows={6} />
      </div>
    </div>
  )
}
