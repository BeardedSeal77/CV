// The job hunt's columns, statuses and application methods, for the board UI.
// The Flask backend (backend/jobs/model/schema.py) owns the data and validates
// every write; this file only mirrors its constants and types.

export const STATUSES = [
  "Shortlisted",
  "Ready",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "Closed",
  "Not interested",
  "Expired",
] as const
export type Status = (typeof STATUSES)[number]

/** Board columns. Statuses keep their detail; the board groups them. */
export const COLUMNS = [
  "backlog",
  "applied",
  "interview",
  "accepted",
  "declined",
  "not_interested",
  "expired",
] as const
export type Column = (typeof COLUMNS)[number]

export const COLUMN_LABEL: Record<Column, string> = {
  backlog: "Backlog",
  applied: "Applied",
  interview: "Interview",
  accepted: "Accepted",
  declined: "Declined",
  not_interested: "Not interested",
  expired: "Expired",
}

/** Which column each status sits in. Screening calls count as interviewing;
 * offers sit in Accepted. Closed means the company
 * closed the role after Ed applied; Expired, that the listing closed first. */
export const COLUMN_OF: Record<Status, Column> = {
  Shortlisted: "backlog",
  Ready: "backlog",
  Applied: "applied",
  Screening: "interview",
  Interview: "interview",
  Offer: "accepted",
  Accepted: "accepted",
  Rejected: "declined",
  Withdrawn: "declined",
  Closed: "declined",
  "Not interested": "not_interested",
  Expired: "expired",
}

/** The status a card gets when it's moved into a column without one */
export const DEFAULT_STATUS: Record<Column, Status> = {
  backlog: "Shortlisted",
  applied: "Applied",
  interview: "Interview",
  accepted: "Offer",
  declined: "Rejected",
  not_interested: "Not interested",
  expired: "Expired",
}

export const statusesIn = (column: Column) =>
  STATUSES.filter((status) => COLUMN_OF[status] === column)

/** How the application is made; `platform` keeps the detail (Workable, Lever, ...) */
export const METHODS = ["indeed", "company_site", "linkedin", "other"] as const
export type Method = (typeof METHODS)[number]

export const METHOD_LABEL: Record<Method, string> = {
  indeed: "Indeed",
  company_site: "Company website",
  linkedin: "LinkedIn",
  other: "Other",
}

/** How keen Ed is on a role; the board groups every column into these bands */
export const INTERESTS = ["High", "Medium", "Low"] as const
export type Interest = (typeof INTERESTS)[number]

export interface JobEvent {
  date: string
  status?: Status
  note: string
  link?: string
  /** Where the update came from, e.g. "gmail:<thread id>" */
  source?: string
  /** Proof kept in the job's folder, e.g. evidence/2026-11-03-confirmation.png */
  evidence?: string[]
}
