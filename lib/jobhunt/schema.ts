import { z } from "zod"

export const STATUSES = [
  "Shortlisted",
  "Ready",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
  "Closed",
  "Ruled out",
] as const

export const StatusSchema = z.enum(STATUSES)
export type Status = z.infer<typeof StatusSchema>

/** Statuses grouped the way the UI and the stats treat them */
export const STATUS_GROUP: Record<Status, "todo" | "active" | "closed"> = {
  Shortlisted: "todo",
  Ready: "todo",
  Applied: "active",
  Screening: "active",
  Interview: "active",
  Offer: "active",
  Rejected: "closed",
  Withdrawn: "closed",
  Closed: "closed",
  "Ruled out": "closed",
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
const optionalDate = z.union([isoDate, z.literal("")]).default("")

export const EventSchema = z.object({
  date: isoDate,
  status: StatusSchema.optional(),
  note: z.string().default(""),
  link: z.string().optional(),
})
export type JobEvent = z.infer<typeof EventSchema>

export const ApplicationSchema = z.object({
  status: StatusSchema,
  updated: optionalDate,
  events: z.array(EventSchema).default([]),
})

export const OPPORTUNITY_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

/** The listing: everything about the role itself, editable as a whole */
export const ListingSchema = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  country: z.string().default(""),
  city: z.string().default(""),
  platform: z.string().default(""),
  url: z.string().default(""),
  email: z.string().default(""),
  pay: z.string().default(""),
  mode: z.string().default(""),
  fit: z.string().default(""),
  posted: optionalDate,
  deadline: optionalDate,
  size: z.string().default(""),
  what: z.string().default(""),
  added: optionalDate,
})
export type Listing = z.infer<typeof ListingSchema>

export const OpportunitySchema = ListingSchema.extend({
  id: z.string().regex(OPPORTUNITY_ID),
  application: ApplicationSchema,
})
export type Opportunity = z.infer<typeof OpportunitySchema>

/** Fields a caller may change on an existing opportunity */
export const ListingPatchSchema = ListingSchema.partial()
export type ListingPatch = z.infer<typeof ListingPatchSchema>

export const DOCS = ["jd", "letter", "notes"] as const
export type DocName = (typeof DOCS)[number]
