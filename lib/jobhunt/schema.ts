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
  "Ruled out",
] as const
export type Status = (typeof STATUSES)[number]

/** Board columns. Statuses keep their detail; the board groups them. */
export const COLUMNS = ["backlog", "applied", "interview", "accepted", "declined", "archived"] as const
export type Column = (typeof COLUMNS)[number]

export const COLUMN_LABEL: Record<Column, string> = {
  backlog: "Backlog",
  applied: "Applied",
  interview: "Interview",
  accepted: "Accepted",
  declined: "Declined",
  archived: "Archived",
}

/** Which column each status sits in. Screening calls count as interviewing;
 * offers sit in Accepted (the status says whether Ed has accepted yet);
 * Ruled out roles were never applied to and live in a hidden archive. */
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
  "Ruled out": "archived",
}

/** The status a card gets when it's moved into a column without one */
export const DEFAULT_STATUS: Record<Column, Status> = {
  backlog: "Shortlisted",
  applied: "Applied",
  interview: "Interview",
  accepted: "Offer",
  declined: "Rejected",
  archived: "Ruled out",
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

export interface JobEvent {
  date: string
  status?: Status
  note: string
  link?: string
}
