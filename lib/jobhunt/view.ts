// The shapes the Flask backend returns for the board (backend/jobs/model/view.py).
// The dates are derived from each job's timeline, so they never disagree with it.
import type { Column, JobEvent, Method, Status } from "./schema"

export interface JobDates {
  /** When the role was listed (the listing's posted date) */
  listed: string
  /** When it was added to the board */
  added: string
  /** First "Applied" event */
  applied: string
  /** Every Screening or Interview event, oldest first */
  interviews: { date: string; status: Status; note: string }[]
  /** The event that set the current status, when the job is accepted or declined */
  outcome: { date: string; status: Status } | null
  deadline: string
  /** Last change to the application */
  updated: string
}

export interface JobSummary {
  id: string
  company: string
  role: string
  column: Column
  status: Status
  country: string
  city: string
  pay: string
  hours: string
  mode: string
  method: Method
  /** Detail behind the method, e.g. Workable, Lever, justjoin.it */
  platform: string
  /** The company's own website */
  website: string
  /** The application link */
  url: string
  email: string
  fit: string
  size: string
  what: string
  hasLetter: boolean
  dates: JobDates
}

export interface JobDetail extends JobSummary {
  /** The job description (jd.md) */
  description: string
  letter: {
    /** The printed letter: header, date, salutation, body, sign-off */
    text: string
    /** Private prep notes kept above the --- line */
    notes: string
  }
  /** Interview prep (notes.md) */
  notes: string
  events: JobEvent[]
}
