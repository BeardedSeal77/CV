import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PayCheck } from "@/lib/jobhunt/pay"

import { GradeChip, money, percent } from "./grade"

const ROWS = [
  ["ask", "Ask"],
  ["min", "Minimum"],
  ["max", "Maximum"],
] as const

function Line({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono text-[12.5px]">{children}</dd>
    </div>
  )
}

/** How a job's pay compares with Ed's current job, from the pay service */
export function PayCheckPanel({ check }: { check: PayCheck }) {
  if (check.status === "no_city") {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Pay check</CardTitle>
          <CardDescription>
            {check.message}
            {check.missing && (
              <>
                {" "}
                (<code className="font-mono text-[12px]">{check.missing}</code>)
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const currency = check.currency ?? ""
  const grades = check.grades ?? {}
  const headline = check.headline ? grades[check.headline] : undefined
  const usual = grades.usual_ask
  const bc = check.blue_card
  const targets = check.targets ?? {}

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pay check
          <GradeChip grade={check.headline_grade} status={check.status} />
        </CardTitle>
        <CardDescription>
          Against Ed&apos;s current job, in{" "}
          <Link
            href={`/jobs/cities/${check.city}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {check.city}
          </Link>
          {check.city_note && <> ({check.city_note})</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {check.headline ? (
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="font-mono text-[11px]">
                <TableHead className="h-7 px-1" />
                <TableHead className="h-7 px-1 text-right">Gross</TableHead>
                <TableHead className="h-7 px-1 text-right">Net</TableHead>
                <TableHead className="h-7 px-1 text-right">vs today</TableHead>
                <TableHead className="h-7 px-1 text-right">Rent</TableHead>
                <TableHead className="h-7 px-1 text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-[12.5px]">
              {ROWS.map(([key, label]) => {
                const row = grades[key]
                if (!row) return null
                return (
                  <TableRow key={key}>
                    <TableCell
                      className="px-1 font-sans text-[13px]"
                      title={row.source}
                    >
                      {label}
                      {row.source && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({row.source.split(" ")[0]})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      {money(row.gross)}
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      {money(row.net)}
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      {row.vs_baseline.toFixed(2)}x
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      {percent(row.rent_share)}
                    </TableCell>
                    <TableCell className="px-1 text-right">
                      <GradeChip grade={row.grade} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-[13.5px] text-muted-foreground">
            The listing gives no salary. The targets below say what to ask for.
          </p>
        )}

        <dl className="space-y-1.5">
          {usual && (
            <Line label={`At ${usual.source ?? "your usual ask"}`}>
              {money(usual.gross, currency)} <GradeChip grade={usual.grade} />
            </Line>
          )}
          {headline && (
            <>
              <Line label="Net a month">
                {money(headline.net, currency)}
                {check.net_zar ? ` (R ${money(check.net_zar)})` : ""}
              </Line>
              <Line label="Living costs covered">
                {headline.cover.toFixed(2)}x after housing
              </Line>
              {check.local_standing && (
                <Line label="Against the local average">
                  {check.local_standing.toFixed(2)}x
                </Line>
              )}
            </>
          )}
          {bc?.minimum && (
            <Line label="Blue Card minimum">
              {money(bc.minimum, currency)}
              {bc.clears !== null && (bc.clears ? " (clears)" : " (below)")}
            </Line>
          )}
          <Line label="Gross for C / B / A">
            {[targets.C, targets.B, targets.A].map((t) => money(t)).join(" / ")}{" "}
            {currency}
          </Line>
        </dl>

        {(bc?.warning || bc?.contract_rule) && (
          <p className="text-[12.5px] text-muted-foreground">
            {[bc.warning, bc.contract_rule].filter(Boolean).join(" ")}
          </p>
        )}
        {check.stale && check.stale.length > 0 && (
          <p className="flex gap-1.5 text-[12.5px] text-domain-automation">
            <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Stale: {check.stale.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
