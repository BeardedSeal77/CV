import type { Grade, PayStatus } from "@/lib/jobhunt/pay"
import { cn } from "@/lib/utils"

// Colour by outcome: A is the best result, D worse than today
const GRADE_TONE: Record<Grade, string> = {
  A: "bg-domain-backend-soft text-domain-backend",
  B: "bg-primary-soft text-primary",
  C: "bg-domain-automation-soft text-domain-automation",
  D: "bg-destructive/15 text-destructive",
}

const MISSING: Partial<Record<PayStatus, string>> = {
  no_city: "no city data",
  no_salary: "no salary",
}

/** A job's pay grade, or why it has none */
export function GradeChip({
  grade,
  status,
  title,
  className,
}: {
  grade?: Grade | null
  status?: PayStatus
  title?: string
  className?: string
}) {
  if (!grade) {
    const label = status ? MISSING[status] : undefined
    if (!label) return null
    return (
      <span
        title={title}
        className={cn(
          "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground",
          className
        )}
      >
        {label}
      </span>
    )
  }
  return (
    <span
      title={
        title ??
        (status === "stale_data" ? "Some figures are stale" : undefined)
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
        GRADE_TONE[grade],
        className
      )}
    >
      Pay {grade}
      {status === "stale_data" && (
        <span aria-label="stale data" className="font-normal opacity-70">
          *
        </span>
      )}
    </span>
  )
}

/** 3080 EUR -> "EUR 3,080" */
export function money(amount: number | null | undefined, currency = "") {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return ""
  const figure = Math.round(amount).toLocaleString("en-GB")
  return currency ? `${currency} ${figure}` : figure
}

export const percent = (share: number) => `${Math.round(share * 100)}%`
