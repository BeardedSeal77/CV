"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CityRow } from "@/lib/jobhunt/pay"

import { action } from "./api"
import { money } from "./grade"

/** Every city's cost of living, housing and the gross needed per grade */
export function CitiesTable() {
  const [rows, setRows] = useState<CityRow[] | null>(null)
  const [cover, setCover] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    action<{
      cities: CityRow[]
      baseline_cover: number
    }>("pay.cities.list")
      .then((data) => {
        setRows(data.cities)
        setCover(data.baseline_cover)
      })
      .catch((err) => setError((err as Error).message))
  }, [])

  if (!rows) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {error || (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading the cities...
          </>
        )}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-muted-foreground">
        Today Ed&apos;s pay covers his everyday costs {cover?.toFixed(2)}x after
        housing. The gross columns are the monthly pay needed for each grade: C
        matches today, B is 1.2x better, A 1.5x.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Cost of living</TableHead>
            <TableHead className="text-right">Rent index</TableHead>
            <TableHead className="text-right">Housing</TableHead>
            <TableHead className="text-right">Everyday</TableHead>
            <TableHead className="text-right">Blue Card min</TableHead>
            <TableHead className="text-right">C</TableHead>
            <TableHead className="text-right">B</TableHead>
            <TableHead className="text-right">A</TableHead>
            <TableHead className="text-right">Data age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono text-[12.5px]">
          {rows.map((row) => (
            <TableRow key={row.slug}>
              <TableCell className="font-sans text-[14px]">
                <Link
                  href={`/jobs/cities/${row.slug}`}
                  className="font-medium hover:underline"
                >
                  {row.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  {row.country}
                  {row.home && " (home)"}
                </span>
                {row.problem && (
                  <p className="text-[12px] text-destructive">{row.problem}</p>
                )}
              </TableCell>
              <TableCell className="text-right">{row.col_index}</TableCell>
              <TableCell className="text-right">
                {row.rent_index ?? ""}
              </TableCell>
              <TableCell className="text-right">{money(row.housing)}</TableCell>
              <TableCell className="text-right">
                {money(row.everyday)}
              </TableCell>
              <TableCell className="text-right">
                {money(row.blue_card?.minimum)}
              </TableCell>
              {row.home ? (
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  today
                </TableCell>
              ) : (
                (["C", "B", "A"] as const).map((g) => (
                  <TableCell key={g} className="text-right">
                    {money(row.targets?.[g], row.currency)}
                  </TableCell>
                ))
              )}
              <TableCell className="text-right">
                <span
                  title={
                    row.stale?.length
                      ? `Stale: ${row.stale.join(", ")}`
                      : `Oldest figure ${row.oldest_as_of}`
                  }
                  className={
                    row.stale?.length
                      ? "inline-flex items-center gap-1 text-domain-automation"
                      : undefined
                  }
                >
                  {row.stale?.length ? (
                    <AlertTriangle aria-label="stale" className="size-3" />
                  ) : null}
                  {row.age_days} d
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
