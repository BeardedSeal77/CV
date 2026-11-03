// The shapes the pay service returns (backend/pay/). The backend computes every
// figure; the board only shows them.

export type Grade = "A" | "B" | "C" | "D"
export type PayStatus = "ok" | "no_city" | "no_salary" | "stale_data"

export interface Salary {
  currency: string
  min?: number
  max?: number
  ask?: number
  period: "month" | "year" | "hour"
  basis: "gross" | "net"
}

/** One gross figure graded against Ed's current job */
export interface GradeRow {
  gross: number
  net: number
  /** (net - housing - fixed) / everyday costs */
  cover: number
  vs_baseline: number
  rent_share: number
  grade: Grade
  /** Where an ask came from: recorded, or how the usual ask was set */
  source?: string
}

export interface BlueCardCheck {
  clears: boolean | null
  minimum: number | null
  next_minimum: number | null
  warning: string | null
  other: { kind: string; minimum: number; clears: boolean | null }[]
  contract_rule: string | null
}

/** Gross per month for each grade, and where rent drops to the limit */
export type Targets = Partial<Record<Grade, number | null>> & {
  rent_share_limit?: number | null
}

export interface PayCheck {
  status: PayStatus
  city?: string | null
  city_note?: string | null
  /** With no_city: the file to add, e.g. data/jobhunt/pay/cities/utrecht.json */
  missing?: string | null
  message?: string
  currency?: string
  grades?: Partial<Record<"ask" | "min" | "max" | "usual_ask", GradeRow>>
  headline_grade?: Grade | null
  headline?: "ask" | "min" | "max" | null
  net_zar?: number | null
  local_standing?: number | null
  blue_card?: BlueCardCheck
  targets?: Targets
  stale?: string[]
  as_of?: string
}

/** The board card's part of a pay check */
export interface PaySummary {
  headline_grade: Grade | null
  status: PayStatus
  message?: string
}

export interface CityRow {
  slug: string
  name: string
  country: string
  col_index: number
  rent_index: number | null
  home: boolean
  oldest_as_of: string
  age_days: number
  currency?: string
  housing?: number
  everyday?: number
  targets?: Targets
  blue_card?: BlueCardCheck
  stale?: string[]
  problem?: string
}

export interface BaselineView {
  baseline: {
    employer: string
    role: string
    started: string
    country: string
    city: string
    currency: string
    gross_monthly: number
    costs_monthly: { housing: number; everyday: number; fixed: number }
    notes: string
  }
  net_monthly: number
  cover: number
  home_city: { slug: string; name: string; col_index: number }
  grades: { grade: Grade; min_vs_baseline: number; label: string }[]
  rent_share_penalty: { above: number; drop_grades: number }
}
