import type { Metadata } from "next"
import { connection } from "next/server"

import { JobPage } from "../_components/detail"

export const metadata: Metadata = { title: "Job", robots: { index: false } }

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection() // local only: render on every request
  const { id } = await params
  return (
    <main
      data-private="jobhunt"
      className="mx-auto max-w-6xl space-y-6 px-4 py-8"
    >
      <JobPage id={id} />
    </main>
  )
}
