import type { Metadata } from "next"
import { connection } from "next/server"

import { jobStats } from "@/lib/jobhunt/stats"
import { listOpportunities } from "@/lib/jobhunt/store"

import { JobsBoard } from "../_components/board"
import { JobsHeader } from "../_components/jobs-header"

export const metadata: Metadata = { title: "Companies", robots: { index: false } }

export default async function CompaniesPage() {
  await connection()
  const opportunities = await listOpportunities()
  return (
    <main data-private="jobhunt" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <JobsHeader title="Companies" />
      <JobsBoard opportunities={opportunities} stats={jobStats(opportunities)} initialView="companies" />
    </main>
  )
}
