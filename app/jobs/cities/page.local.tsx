import type { Metadata } from "next"
import { connection } from "next/server"

import { CitiesTable } from "../_components/cities"
import { JobsHeader } from "../_components/jobs-header"

export const metadata: Metadata = {
  title: "Cities",
  robots: { index: false },
}

export default async function CitiesPage() {
  await connection() // local only: render on every request
  return (
    <main
      data-private="jobhunt"
      className="mx-auto max-w-6xl space-y-6 px-4 py-8"
    >
      <JobsHeader title="Cities" />
      <CitiesTable />
    </main>
  )
}
