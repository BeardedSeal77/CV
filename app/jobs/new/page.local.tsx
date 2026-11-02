import type { Metadata } from "next"

import { JobsHeader } from "../_components/jobs-header"
import { NewOpportunityForm } from "../_components/new-form"

export const metadata: Metadata = { title: "Add opportunity", robots: { index: false } }

export default function NewOpportunityPage() {
  return (
    <main data-private="jobhunt" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <JobsHeader title="Add opportunity" />
      <NewOpportunityForm />
    </main>
  )
}
