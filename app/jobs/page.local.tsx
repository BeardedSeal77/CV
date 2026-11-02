import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"

import { Button } from "@/components/ui/button"
import { jobStats } from "@/lib/jobhunt/stats"
import { listOpportunities } from "@/lib/jobhunt/store"

import { JobsBoard } from "./_components/board"
import { JobsHeader } from "./_components/jobs-header"

export const metadata: Metadata = { title: "Job hunt", robots: { index: false } }

export default async function JobsPage() {
  await connection() // read the files on every request
  const opportunities = await listOpportunities()
  return (
    <main data-private="jobhunt" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <JobsHeader title="Job hunt">
        <Button nativeButton={false} render={<Link href="/jobs/new" />}>
          Add opportunity
        </Button>
      </JobsHeader>
      <JobsBoard opportunities={opportunities} stats={jobStats(opportunities)} />
    </main>
  )
}
