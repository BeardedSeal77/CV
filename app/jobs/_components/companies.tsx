"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { JobSummary } from "@/lib/jobhunt/view"

import { action } from "./api"
import { COUNTRY, StatusPill } from "./status"

/** The backend's summary numbers (jobs.stats) */
interface JobStats {
  applied: number
  active: number
  rejected: number
  heardBackRate: number | null
  lettersReady: number
  companies: number
}

/** Every company on the board, with the roles applied for at each */
export function CompaniesBoard() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const [stats, setStats] = useState<JobStats | null>(null)
  const [country, setCountry] = useState("all")
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      action<{ jobs: JobSummary[] }>("jobs.list", { include_archived: true }),
      action<JobStats>("jobs.stats"),
    ])
      .then(([list, numbers]) => {
        setJobs(list.jobs)
        setStats(numbers)
      })
      .catch((err) => setError((err as Error).message))
  }, [])

  if (!jobs || !stats) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {error || (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading the companies...
          </>
        )}
      </p>
    )
  }

  const countries = [
    ...new Set(jobs.map((j) => j.country).filter(Boolean)),
  ].sort()
  const q = query.trim().toLowerCase()
  const shown = jobs.filter(
    (j) =>
      (country === "all" || j.country === country) &&
      (!q || `${j.company} ${j.role} ${j.city}`.toLowerCase().includes(q))
  )
  const companies = [...new Set(shown.map((j) => j.company))].sort((a, b) =>
    a.localeCompare(b)
  )

  const tiles: [string, string | number][] = [
    ["Applied", stats.applied],
    ["Active", stats.active],
    ["Rejected", stats.rejected],
    [
      "Heard back",
      stats.heardBackRate === null ? "None yet" : `${stats.heardBackRate}%`,
    ],
    ["Letter ready", stats.lettersReady],
    ["Companies", stats.companies],
  ]

  return (
    <div className="space-y-6">
      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
      >
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card px-3.5 py-3">
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            <div className="font-mono text-[11.5px] text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Country">
          {["all", ...countries].map((c) => (
            <Button
              key={c}
              size="sm"
              variant={country === c ? "default" : "outline"}
              aria-pressed={country === c}
              onClick={() => setCountry(c)}
            >
              {c === "all" ? "All" : (COUNTRY[c] ?? c)}
            </Button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or role"
          aria-label="Search"
          className="min-w-0 flex-1 sm:max-w-64"
        />
      </div>

      {!companies.length && (
        <p className="rounded-lg border border-dashed p-5 text-muted-foreground">
          {jobs.length
            ? "Nothing matches this filter."
            : "No jobs yet: add one on the board."}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {companies.map((company) => {
          const these = shown.filter((j) => j.company === company)
          const first = these[0]
          const info = [
            COUNTRY[first.country] ?? first.country,
            first.size,
            first.what,
          ].filter(Boolean)
          return (
            <Card key={company} size="sm">
              <CardHeader>
                <CardTitle>
                  {company}
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                    {these.length} {these.length > 1 ? "positions" : "position"}
                  </span>
                </CardTitle>
                {info.length > 0 && (
                  <CardDescription>{info.join(", ")}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {these.map((j) => (
                  <div
                    key={j.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed pt-2"
                  >
                    <Link
                      href={`/jobs/${j.id}`}
                      className="text-sm underline underline-offset-4"
                    >
                      {j.role}
                    </Link>
                    <StatusPill status={j.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
