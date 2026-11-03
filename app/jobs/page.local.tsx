import type { Metadata } from "next"
import { connection } from "next/server"

import { JobsHeader } from "./_components/jobs-header"
import { Kanban } from "./_components/kanban"

export const metadata: Metadata = {
  title: "Job hunt",
  robots: { index: false },
}

export default async function JobsPage() {
  await connection() // local only: render on every request
  return (
    <main
      data-private="jobhunt"
      className="mx-auto max-w-[1600px] space-y-6 px-4 py-8"
    >
      <JobsHeader title="Job hunt" />
      <Kanban />
    </main>
  )
}
