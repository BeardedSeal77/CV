import { type Status, STATUS_GROUP } from "@/lib/jobhunt/schema"
import { cn } from "@/lib/utils"

export const PIPELINE_ORDER: Status[] = [
  "Offer",
  "Interview",
  "Screening",
  "Applied",
  "Ready",
  "Shortlisted",
  "Rejected",
  "Withdrawn",
  "Closed",
  "Ruled out",
]

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

const TONE: Record<Status, string> = {
  Shortlisted: "bg-muted text-muted-foreground",
  Ready: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Applied: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Screening: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Interview: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Rejected: "bg-destructive/15 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
  Closed: "bg-muted text-muted-foreground",
  "Ruled out": "bg-muted text-muted-foreground",
}

export const EDGE: Record<"todo" | "active" | "closed", string> = {
  todo: "border-l-border",
  active: "border-l-sky-500",
  closed: "border-l-border",
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

export function statusGroup(status: Status) {
  return STATUS_GROUP[status]
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

export function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000
  )
}
