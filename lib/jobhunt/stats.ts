import { type Opportunity, STATUS_GROUP } from "./schema"

export function appliedOn(opp: Opportunity) {
  return opp.application.events.find((e) => e.status === "Applied")?.date ?? ""
}

export function lastEvent(opp: Opportunity) {
  return [...opp.application.events].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
}

export function jobStats(opps: Opportunity[]) {
  const applied = opps.filter((o) => appliedOn(o))
  const heardBack = applied.filter((o) => o.application.status !== "Applied")
  return {
    total: opps.length,
    applied: applied.length,
    active: opps.filter((o) => STATUS_GROUP[o.application.status] === "active").length,
    rejected: opps.filter((o) => o.application.status === "Rejected").length,
    heardBackRate: applied.length ? Math.round((heardBack.length / applied.length) * 100) : null,
    lettersReady: opps.filter((o) => o.application.status === "Ready").length,
    companies: new Set(opps.map((o) => o.company)).size,
  }
}

export type JobStats = ReturnType<typeof jobStats>
