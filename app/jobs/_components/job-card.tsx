"use client"

import { FileText, MapPin } from "lucide-react"

import { METHOD_LABEL, statusesIn } from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"

import { COUNTRY, Dot, fmtDate, StatusPill } from "./status"

/** One job on the board: drag it to move it, click it to open it */
export function JobCard({
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
