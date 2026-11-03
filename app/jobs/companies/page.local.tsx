import type { Metadata } from "next"
import { connection } from "next/server"

import { CompaniesBoard } from "../_components/companies"
import { JobsHeader } from "../_components/jobs-header"

export const metadata: Metadata = {
  title: "Companies",
  robots: { index: false },
}

export default async function CompaniesPage() {
  await connection() // local only: render on every request
  return (
    <main
      data-private="jobhunt"
      className="mx-auto max-w-5xl space-y-6 px-4 py-8"
    >
      <JobsHeader title="Companies" />
      <CompaniesBoard />
    </main>
  )
}
