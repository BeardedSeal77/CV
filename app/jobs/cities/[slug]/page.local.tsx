import type { Metadata } from "next"
import { connection } from "next/server"

import { CityPage } from "../../_components/city"

export const metadata: Metadata = { title: "City", robots: { index: false } }

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await connection() // local only: render on every request
  const { slug } = await params
  return (
    <main
      data-private="jobhunt"
      className="mx-auto max-w-5xl space-y-6 px-4 py-8"
    >
      <CityPage slug={slug} />
    </main>
  )
}
