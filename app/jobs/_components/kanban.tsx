"use client"

import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  type Column,
  COLUMN_LABEL,
  COLUMN_OF,
  COLUMNS,
  DEFAULT_STATUS,
  type Interest,
  INTERESTS,
  type Status,
} from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"
import { cn } from "@/lib/utils"

import { action, ActionError, type Lifecycle, loadLifecycle } from "./api"
import { AddJobDialog } from "./add-job-dialog"
import { INTEREST_TONE } from "./interest"
import { JobCard } from "./job-card"
import { JobDialog } from "./job-dialog"

const BOARD: Column[] = [...COLUMNS]

// A soft accent per column, so the board reads left to right at a glance
const COLUMN_TONE: Record<Column, string> = {
  backlog: "bg-muted-foreground/40",
  applied: "bg-primary",
  interview: "bg-domain-infra",
  accepted: "bg-domain-backend",
  declined: "bg-destructive/70",
  not_interested: "bg-muted-foreground/30",
  expired: "bg-muted-foreground/20",
}

// A drop target: one column within one interest band
const cellKey = (column: Column, interest: Interest) => `${interest}:${column}`

const listJobs = () =>
  action<{ jobs: JobSummary[]; version: string }>("jobs.list", {})

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

/** The job hunt as a Kanban board: drag a card to move it, click it for everything about it */
export function Kanban() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const version = useRef("")
  // The same fingerprint as state, so the open dialog reloads when files change
  const [seen, setSeen] = useState("")
  const [lifecycle, setLifecycle] = useState<Lifecycle>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [dragging, setDragging] = useState<JobSummary | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [folded, setFolded] = useState<Interest[]>([])
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

  async function setInterest(job: JobSummary, interest: Interest) {
    setError("")
    setJobs((all) =>
      (all ?? []).map((j) => (j.id === job.id ? { ...j, interest } : j))
    )
    try {
      await action("jobs.update", { id: job.id, interest })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Another band changes the interest, another column moves the job
  async function drop(job: JobSummary, column: Column, interest: Interest) {
    if (interest !== job.interest) await setInterest(job, interest)
    if (column !== job.column) await move({ ...job, interest }, column)
    else await refresh()
  }

  const valid = (column: Column) =>
    !dragging ||
    column === dragging.column ||
    Boolean(targetStatus(lifecycle, dragging.status, column))

  const columns = BOARD
  const all = jobs ?? []

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
            className="grid gap-x-3 gap-y-2"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(15.5rem, 1fr))`,
            }}
          >
            {columns.map((column) => (
              <h2
                key={column}
                className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-[14px] font-semibold"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", COLUMN_TONE[column])}
                  />
                  {COLUMN_LABEL[column]}
                </span>
                <span className="font-mono text-[12px] font-normal text-muted-foreground">
                  {all.filter((j) => j.column === column).length}
                </span>
              </h2>
            ))}

            {INTERESTS.map((interest) => {
              const band = all.filter((j) => j.interest === interest)
              const open = !folded.includes(interest)
              return (
                <Fragment key={interest}>
                  <div style={{ gridColumn: "1 / -1" }} className="pt-2">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setFolded((f) =>
                          open
                            ? [...f, interest]
                            : f.filter((i) => i !== interest)
                        )
                      }
                      className="sticky left-0 flex items-center gap-2 rounded-md px-1 py-0.5 text-[13px] font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-3.5 text-muted-foreground transition-transform",
                          !open && "-rotate-90"
                        )}
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "h-3 w-1 rounded-full",
                          INTEREST_TONE[interest]
                        )}
                      />
                      {interest} interest
                      <span className="font-mono text-[12px] font-normal text-muted-foreground">
                        {band.length}
                      </span>
                    </button>
                  </div>

                  {open &&
                    columns.map((column) => {
                      const key = cellKey(column, interest)
                      const cards = band
                        .filter((j) => j.column === column)
                        .sort((a, b) =>
                          b.dates.updated.localeCompare(a.dates.updated)
                        )
                      const ok = valid(column)
                      return (
                        <section
                          key={key}
                          aria-label={`${COLUMN_LABEL[column]}, ${interest} interest`}
                          onDragOver={(e) => {
                            if (!dragging) return
                            e.preventDefault()
                            setOver(key)
                          }}
                          onDragLeave={() =>
                            setOver((c) => (c === key ? null : c))
                          }
                          onDrop={(e) => {
                            e.preventDefault()
                            const job = dragging
                            setOver(null)
                            setDragging(null)
                            if (job) drop(job, column, interest)
                          }}
                          className={cn(
                            "flex min-h-24 flex-col gap-2 rounded-lg border bg-muted/40 p-2 transition-[background-color,border-color,opacity]",
                            dragging && !ok && "opacity-45",
                            over === key &&
                              ok &&
                              "border-primary bg-primary-soft",
                            over === key && !ok && "border-domain-automation"
                          )}
                        >
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
                          {cards.length === 0 && dragging && ok && (
                            <p className="rounded-md border border-dashed px-3 py-6 text-center text-[12.5px] text-muted-foreground">
                              Drop here
                            </p>
                          )}
                        </section>
                      )
                    })}
                </Fragment>
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
