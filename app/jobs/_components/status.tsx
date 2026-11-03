import type { Status } from "@/lib/jobhunt/schema"
import { cn } from "@/lib/utils"

export const COUNTRY: Record<string, string> = {
  LV: "Latvia",
  LT: "Lithuania",
  PL: "Poland",
  EE: "Estonia",
  DE: "Germany",
  NL: "Netherlands",
  AT: "Austria",
  CZ: "Czechia",
  IE: "Ireland",
}

// Workbench colours: each stage of the hunt gets its own soft fill and ink
const TONE: Record<Status, string> = {
  Shortlisted: "bg-muted text-muted-foreground",
  Ready: "bg-domain-automation-soft text-domain-automation",
  Applied: "bg-primary-soft text-primary",
  Screening: "bg-domain-infra-soft text-domain-infra",
  Interview: "bg-domain-infra-soft text-domain-infra",
  Offer: "bg-domain-backend-soft text-domain-backend",
  Accepted: "bg-domain-backend text-background",
  Rejected: "bg-destructive/15 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
  Closed: "bg-muted text-muted-foreground",
  "Ruled out": "bg-muted text-muted-foreground",
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[status]
      )}
    >
      {status}
    </span>
  )
}

export function fmtDate(date: string) {
  if (!date) return ""
  const d = new Date(`${date}T12:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

/** Today as YYYY-MM-DD in local time, for date inputs */
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** A small round separator between inline facts */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mx-1.5 inline-block size-[3px] rounded-full bg-current align-middle opacity-60",
        className
      )}
    />
  )
}
