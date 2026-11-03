"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Archive, FileText, Loader2, MapPin, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  type Column,
  COLUMN_LABEL,
  COLUMN_OF,
  DEFAULT_STATUS,
  METHOD_LABEL,
  type Status,
  statusesIn,
} from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"
import { cn } from "@/lib/utils"

import { action, ActionError, type Lifecycle, loadLifecycle } from "./api"
import { AddJobDialog } from "./add-job-dialog"
import { JobDialog } from "./job-dialog"
import { COUNTRY, Dot, fmtDate, StatusPill } from "./status"

const BOARD: Column[] = [
  "backlog",
  "applied",
  "interview",
  "accepted",
  "declined",
  "not_interested",
]

// A soft accent per column, so the board reads left to right at a glance
const COLUMN_TONE: Record<Column, string> = {
  backlog: "bg-muted-foreground/40",
  applied: "bg-primary",
  interview: "bg-domain-infra",
  accepted: "bg-domain-backend",
  declined: "bg-destructive/70",
  not_interested: "bg-muted-foreground/30",
  archived: "bg-muted-foreground/30",
}

const listJobs = () =>
  action<{ jobs: JobSummary[]; version: string }>("jobs.list", {
    include_archived: true,
  })

/** The status a card would take moving into a column, if its lifecycle allows it */
export function targetStatus(
  lifecycle: Lifecycle,
  from: Status,
  column: Column
): Status | undefined {
  const allowed = (lifecycle[from] ?? []).map((t) => t.to)
  if (allowed.includes(DEFAULT_STATUS[column])) return DEFAULT_STATUS[column]
  return allowed.find((status) => COLUMN_OF[status] === column)
}

function JobCard({
  job,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  job: JobSummary
  onOpen: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const place = [job.city, COUNTRY[job.country] ?? job.country]
    .filter(Boolean)
    .join(", ")
  const showStatus = statusesIn(job.column).length > 1
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", job.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="w-full cursor-grab rounded-lg border bg-card p-3 text-left transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[14.5px] leading-snug font-semibold">
          {job.company}
        </p>
        {job.hasLetter && (
          <FileText
            aria-label="Cover letter written"
            className="mt-0.5 size-3.5 shrink-0 text-primary"
          />
        )}
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
        {job.role}
      </p>
      {place && (
        <p className="mt-2 flex items-center gap-1 text-[12.5px] text-muted-foreground">
          <MapPin aria-hidden className="size-3" />
          {place}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {showStatus && <StatusPill status={job.status} />}
        <span className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {METHOD_LABEL[job.method]}
        </span>
        {job.pay && (
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {job.pay}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        Added {fmtDate(job.dates.added)}
        {job.dates.applied && (
          <>
            <Dot />
            Applied {fmtDate(job.dates.applied)}
          </>
        )}
      </p>
    </button>
  )
}

/** The job hunt as a Kanban board: drag a card to move it, click it for everything about it */
export function Kanban() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const version = useRef("")
  // The same fingerprint as state, so the open dialog reloads when files change
  const [seen, setSeen] = useState("")
  const [lifecycle, setLifecycle] = useState<Lifecycle>({})
  const [showArchived, setShowArchived] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [dragging, setDragging] = useState<JobSummary | null>(null)
  const [over, setOver] = useState<Column | null>(null)
  const [error, setError] = useState("")
  // A move the lifecycle doesn't allow, waiting for "fix a mistake?"
  const [pending, setPending] = useState<{
    job: JobSummary
    column: Column
    message: string
  } | null>(null)

  const apply = useCallback((data: { jobs: JobSummary[]; version: string }) => {
    setJobs(data.jobs)
    version.current = data.version
    setSeen(data.version)
  }, [])

  const refresh = useCallback(async () => apply(await listJobs()), [apply])

  useEffect(() => {
    listJobs()
      .then(apply)
      .catch((err) => setError((err as Error).message))
    loadLifecycle()
      .then(setLifecycle)
      .catch(() => {})
  }, [apply])

  // Claude Code edits jobs over MCP; poll the fingerprint and refetch when it moves
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const { version: latest } = await action<{ version: string }>(
          "jobs.version"
        )
        if (latest !== version.current) await refresh()
      } catch {
        // The backend restarting; try again next tick
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [refresh])

  async function move(job: JobSummary, column: Column, correction = false) {
    if (job.column === column) return
    const status = targetStatus(lifecycle, job.status, column)
    if (!status && !correction) {
      const allowed = (lifecycle[job.status] ?? []).map((t) => t.to).join(", ")
      setPending({
        job,
        column,
        message: `${job.status} doesn't normally move to ${COLUMN_LABEL[column]}${allowed ? ` (it can go to ${allowed})` : ""}.`,
      })
      return
    }
    setError("")
    setPending(null)
    setJobs((all) =>
      (all ?? []).map((j) =>
        j.id === job.id
          ? { ...j, column, status: status ?? DEFAULT_STATUS[column] }
          : j
      )
    )
    try {
      await action("jobs.move", {
        id: job.id,
        column,
        ...(status ? { status } : {}),
        ...(correction ? { correction: true } : {}),
      })
    } catch (err) {
      if (err instanceof ActionError && err.code === "transition_not_allowed") {
        setPending({ job, column, message: err.message })
      } else setError((err as Error).message)
    }
    await refresh()
  }

  const valid = (column: Column) =>
    !dragging ||
    column === dragging.column ||
    Boolean(targetStatus(lifecycle, dragging.status, column))

  const columns = showArchived ? [...BOARD, "archived" as Column] : BOARD
  const all = jobs ?? []
  const archived = all.filter((j) => j.column === "archived").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[13px]">
          {BOARD.map((column) => (
            <div key={column} className="flex items-baseline gap-1.5">
              <dt className="text-muted-foreground">{COLUMN_LABEL[column]}</dt>
              <dd className="font-medium">
                {all.filter((j) => j.column === column).length}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive data-icon="inline-start" />
            {showArchived ? "Hide archived" : `Show archived (${archived})`}
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus data-icon="inline-start" />
            Add job
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {pending && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-domain-automation/40 bg-domain-automation-soft px-4 py-3 text-[14px]"
        >
          <p>
            <span className="font-semibold">{pending.job.company}:</span>{" "}
            {pending.message} Fix a mistake?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => move(pending.job, pending.column, true)}
            >
              Move anyway
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!jobs ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading the board...
        </p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(15.5rem, 1fr))`,
            }}
          >
            {columns.map((column) => {
              const cards = all
                .filter((j) => j.column === column)
                .sort((a, b) => b.dates.updated.localeCompare(a.dates.updated))
              const ok = valid(column)
              return (
                <section
                  key={column}
                  aria-label={COLUMN_LABEL[column]}
                  onDragOver={(e) => {
                    if (!dragging) return
                    e.preventDefault()
                    setOver(column)
                  }}
                  onDragLeave={() => setOver((c) => (c === column ? null : c))}
                  onDrop={(e) => {
                    e.preventDefault()
                    const job = dragging
                    setOver(null)
                    setDragging(null)
                    if (job) move(job, column)
                  }}
                  className={cn(
                    "flex min-h-[60vh] flex-col rounded-lg border bg-muted/40 p-2 transition-[background-color,border-color,opacity]",
                    dragging && !ok && "opacity-45",
                    over === column && ok && "border-primary bg-primary-soft",
                    over === column && !ok && "border-domain-automation"
                  )}
                >
                  <header className="flex items-center justify-between px-1.5 pt-1 pb-2.5">
                    <h2 className="flex items-center gap-2 text-[14px] font-semibold">
                      <span
                        aria-hidden
                        className={cn(
                          "size-2 rounded-full",
                          COLUMN_TONE[column]
                        )}
                      />
                      {COLUMN_LABEL[column]}
                    </h2>
                    <span className="font-mono text-[12px] text-muted-foreground">
                      {cards.length}
                    </span>
                  </header>
                  <div className="flex flex-col gap-2">
                    {cards.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onOpen={() => setOpenId(job.id)}
                        onDragStart={() => setDragging(job)}
                        onDragEnd={() => {
                          setDragging(null)
                          setOver(null)
                        }}
                      />
                    ))}
                    {cards.length === 0 && (
                      <p className="rounded-md border border-dashed px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                        {dragging && ok ? "Drop here" : "No jobs here"}
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      <JobDialog
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={refresh}
        version={seen}
        lifecycle={lifecycle}
      />
      <AddJobDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={async (job) => {
          setAdding(false)
          await refresh()
          setOpenId(job.id)
        }}
      />
    </div>
  )
}
