import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { getOpportunity, opportunityExists } from "@/lib/jobhunt/store"

import { OpportunityDetail } from "../_components/detail"
import { JobsHeader } from "../_components/jobs-header"

export const metadata: Metadata = { title: "Opportunity", robots: { index: false } }

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  if (!(await opportunityExists(id))) notFound()
  const data = await getOpportunity(id)
  return (
    <main data-private="jobhunt" className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <JobsHeader title={data.opportunity.company}>
        <span className="text-muted-foreground">{data.opportunity.role}</span>
      </JobsHeader>
      <OpportunityDetail {...data} />
    </main>
  )
}
