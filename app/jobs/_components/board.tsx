"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import type { Opportunity } from "@/lib/jobhunt/schema"
import { appliedOn, type JobStats, lastEvent } from "@/lib/jobhunt/stats"
import { cn } from "@/lib/utils"

import {
  COUNTRY,
  daysBetween,
  EDGE,
  fmtDate,
  PIPELINE_ORDER,
  statusGroup,
  StatusPill,
} from "./status"

export type View = "pipeline" | "opps" | "companies"

const VIEWS: [View, string][] = [
  ["pipeline", "Pipeline"],
  ["opps", "Opportunities"],
  ["companies", "Companies"],
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs whitespace-nowrap tabular-nums",
        className
      )}
    >
      {children}
    </span>
  )
}

function Row({ opp }: { opp: Opportunity }) {
  const status = opp.application.status
  const group = statusGroup(status)
  const applied = appliedOn(opp)
  const last = lastEvent(opp)
  let when: React.ReactNode = null
  if (group === "active" && applied) {
    when = (
      <Chip>
        applied {fmtDate(applied)} · {daysBetween(applied, todayStr())}d
      </Chip>
    )
  } else if (group === "todo" && opp.deadline) {
    const left = daysBetween(todayStr(), opp.deadline)
    when = (
      <Chip
        className={cn(
          left <= 3 && "border-transparent bg-destructive/15 text-destructive",
          left > 3 && left <= 7 && "border-transparent bg-amber-500/15"
        )}
      >
        {left < 0 ? "closed" : "closes"} {fmtDate(opp.deadline)}
      </Chip>
    )
  } else if (last) {
    when = <Chip>{fmtDate(last.date)}</Chip>
  }
  return (
    <Link
      href={`/jobs/${opp.id}`}
      className={cn(
        "grid gap-x-4 gap-y-1 rounded-lg border border-l-4 bg-card p-3 hover:border-muted-foreground/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        EDGE[group]
      )}
    >
      <span className="min-w-0">
        <span className="block font-semibold">{opp.company}</span>
        <span className="block truncate text-sm text-muted-foreground">{opp.role}</span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <Chip>
          {COUNTRY[opp.country] ?? opp.country}
          {opp.city && ` · ${opp.city}`}
        </Chip>
        {opp.platform && <Chip>{opp.platform}</Chip>}
        {when}
        <StatusPill status={status} />
      </span>
    </Link>
  )
}

export function JobsBoard({
  opportunities,
  stats,
  initialView = "pipeline",
}: {
  opportunities: Opportunity[]
  stats: JobStats
  initialView?: View
}) {
  const [view, setView] = useState<View>(initialView)
  const [country, setCountry] = useState("all")
  const [query, setQuery] = useState("")

  const countries = useMemo(
    () => [...new Set(opportunities.map((o) => o.country).filter(Boolean))].sort(),
    [opportunities]
  )
  const shown = opportunities.filter((o) => {
    if (country !== "all" && o.country !== country) return false
    const q = query.trim().toLowerCase()
    return !q || `${o.company} ${o.role} ${o.city}`.toLowerCase().includes(q)
  })

  const tiles: [string, string | number][] = [
    ["Applied", stats.applied],
    ["Active", stats.active],
    ["Rejected", stats.rejected],
    ["Heard back", stats.heardBackRate === null ? "–" : `${stats.heardBackRate}%`],
    ["Letter ready", stats.lettersReady],
    ["Companies", stats.companies],
  ]

  return (
    <div className="space-y-6">
      <section aria-label="Summary" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card px-3.5 py-3">
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
          </div>
        ))}
      </section>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background py-2.5">
        <div className="flex gap-1" role="group" aria-label="View">
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className="rounded-md border px-3 py-1.5 text-sm font-medium aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Country">
          {["all", ...countries].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={country === c}
              onClick={() => setCountry(c)}
              className="rounded-md border px-3 py-1.5 text-sm aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {c === "all" ? "All" : (COUNTRY[c] ?? c)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or role"
          aria-label="Search"
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm sm:max-w-64"
        />
      </div>

      {!opportunities.length && (
        <p className="rounded-lg border border-dashed p-5 text-muted-foreground">
          No opportunities yet. Use Add opportunity to log the first role you&apos;re considering.
        </p>
      )}
      {opportunities.length > 0 && !shown.length && (
        <p className="rounded-lg border border-dashed p-5 text-muted-foreground">
          Nothing matches this filter.
        </p>
      )}

      {view === "pipeline" &&
        PIPELINE_ORDER.map((status) => {
          const these = shown
            .filter((o) => o.application.status === status)
            .sort((a, b) => (lastEvent(b)?.date ?? "").localeCompare(lastEvent(a)?.date ?? ""))
          if (!these.length) return null
          return (
            <details key={status} open={statusGroup(status) !== "closed"} className="group space-y-2">
              <summary className="flex cursor-pointer list-none items-baseline gap-2.5">
                <h2 className="text-xl font-semibold">{status}</h2>
                <span className="font-mono text-xs text-muted-foreground">{these.length}</span>
              </summary>
              <div className="grid gap-1.5">
                {these.map((o) => (
                  <Row key={o.id} opp={o} />
                ))}
              </div>
            </details>
          )
        })}

      {view === "opps" &&
        countries
          .filter((c) => country === "all" || c === country)
          .map((c) => {
            const these = shown
              .filter((o) => o.country === c)
              .sort(
                (a, b) =>
                  PIPELINE_ORDER.indexOf(a.application.status) -
                    PIPELINE_ORDER.indexOf(b.application.status) ||
                  a.company.localeCompare(b.company)
              )
            if (!these.length) return null
            return (
              <section key={c} className="space-y-2">
                <h2 className="flex items-baseline gap-2.5 text-xl font-semibold">
                  {COUNTRY[c] ?? c}
                  <span className="font-mono text-xs text-muted-foreground">{these.length}</span>
                </h2>
                <div className="grid gap-1.5">
                  {these.map((o) => (
                    <Row key={o.id} opp={o} />
                  ))}
                </div>
              </section>
            )
          })}

      {view === "companies" && (
        <div className="grid gap-3 md:grid-cols-2">
          {[...new Set(shown.map((o) => o.company))]
            .sort((a, b) => a.localeCompare(b))
            .map((company) => {
              const these = shown.filter((o) => o.company === company)
              const first = these[0]
              const info = [COUNTRY[first.country] ?? first.country, first.size, first.what]
                .filter(Boolean)
                .join(" · ")
              return (
                <article key={company} className="space-y-2 rounded-lg border bg-card p-4">
                  <h3 className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
                    {company}
                    <span className="font-mono text-xs text-muted-foreground">
                      {these.length} position{these.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  {info && <p className="text-sm text-muted-foreground">{info}</p>}
                  {these.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-2"
                    >
                      <Link href={`/jobs/${o.id}`} className="text-sm underline underline-offset-4">
                        {o.role}
                      </Link>
                      <StatusPill status={o.application.status} />
                    </div>
                  ))}
                </article>
              )
            })}
        </div>
      )}
    </div>
  )
}
