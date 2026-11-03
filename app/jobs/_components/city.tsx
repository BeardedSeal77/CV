"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { BlueCardCheck, Targets } from "@/lib/jobhunt/pay"

import { cn } from "@/lib/utils"

import { action } from "./api"
import { money } from "./grade"
import { JobsHeader } from "./jobs-header"
import { fmtDate } from "./status"

type Block = Record<string, unknown> & { as_of?: string; source?: string }

interface CityDetail {
  city: {
    slug: string
    name: string
    country: string
    aliases: string[]
    numbeo: Block
    housing: Block | null
    fixed_monthly: number | null
    wages: Block | null
    prices: Record<string, number>
    notes: string
  }
  country: Block & {
    name: string
    code: string
    currency: string
    tax_model: string
    tax_params: Record<string, unknown>
    blue_card: Block[]
    blue_card_next: Block | null
    contract_rule: string | null
  }
  currency: string
  housing: number
  everyday: number
  targets: Targets
  blue_card: BlueCardCheck
  stale: string[]
}

// Readable names for the figures a city or country file holds
const LABEL: Record<string, string> = {
  col_index: "Cost of living index",
  rent_index: "Rent index",
  col_plus_rent_index: "Cost of living + rent",
  groceries_index: "Groceries index",
  restaurant_index: "Restaurant index",
  purchasing_power_index: "Purchasing power",
  single_person_no_rent: "Single person, no rent",
  rent_1bed_centre: "1-bed flat, centre",
  rent_1bed_outside: "1-bed flat, outside",
  meal_mcdonalds: "McDonald's meal",
  cappuccino: "Cappuccino",
  transit_pass: "Monthly transit pass",
  avg_net_salary: "Average net salary",
  planning_monthly: "Planning figure",
  breakdown: "Breakdown",
  market_range: "Market range",
  city_avg_gross: "City average gross",
}

function Figures({ block }: { block: Block }) {
  const rows = Object.entries(block).filter(
    ([key, value]) =>
      key !== "as_of" && key !== "source" && value !== null && value !== ""
  )
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 text-[13.5px]">
      {rows.map(([key, value]) => {
        // Words (a breakdown, a market range) read on their own line
        const prose =
          typeof value === "string" && /[a-z]{3,} [a-z]{3,}/i.test(value)
        return (
          <div key={key} className="contents">
            <dt className={cn("text-muted-foreground", prose && "col-span-2")}>
              {LABEL[key] ?? key.replaceAll("_", " ")}
            </dt>
            <dd
              className={
                prose
                  ? "col-span-2 -mt-1 text-[13px]"
                  : "text-right font-mono text-[12.5px]"
              }
            >
              {typeof value === "number"
                ? value.toLocaleString("en-GB")
                : String(value)}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function Source({ block }: { block: Block | null }) {
  if (!block?.as_of) return null
  return (
    <>
      {block.source || "No source given"}, as of {fmtDate(block.as_of)}
    </>
  )
}

/** One city with every figure, where it came from and how old it is */
export function CityPage({ slug }: { slug: string }) {
  const [data, setData] = useState<CityDetail | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    action<CityDetail>("pay.cities.get", { city: slug })
      .then(setData)
      .catch((err) => setError((err as Error).message))
  }, [slug])

  if (!data) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {error || (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading the city...
          </>
        )}
      </p>
    )
  }

  const { city, country, currency, targets } = data
  return (
    <>
      <JobsHeader title={city.name}>
        <span className="text-muted-foreground">{country.name}</span>
      </JobsHeader>

      {data.stale.length > 0 && (
        <p className="flex gap-1.5 text-[13.5px] text-domain-automation">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          Stale: {data.stale.join(", ")}. Refresh with pay.cities.upsert or
          pay.countries.upsert.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Gross needed a month</CardTitle>
            <CardDescription>
              With housing at {money(data.housing, currency)} and everyday costs
              at {money(data.everyday, currency)}, scaled from Ed&apos;s own
              spending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Figures
              block={{
                "C: as good as today": money(targets.C, currency),
                "B: 1.2x better": money(targets.B, currency),
                "A: 1.5x better": money(targets.A, currency),
                "Rent under the limit": money(
                  targets.rent_share_limit,
                  currency
                ),
                "Blue Card minimum": money(data.blue_card.minimum, currency),
              }}
            />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Housing</CardTitle>
            <CardDescription>
              <Source block={city.housing} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {city.housing ? (
              <Figures block={city.housing} />
            ) : (
              <p className="text-[13.5px] text-muted-foreground">
                The home city: the baseline&apos;s housing applies.
              </p>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Cost of living</CardTitle>
            <CardDescription>
              <Source block={city.numbeo} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Figures block={city.numbeo} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{country.name}</CardTitle>
            <CardDescription>
              Tax: {String(country.tax_source || "no source")}, as of{" "}
              {fmtDate(String(country.tax_as_of ?? ""))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Figures
              block={{
                "Tax model": country.tax_model,
                "Average gross": money(
                  country.avg_gross_monthly as number,
                  currency
                ),
                ...Object.fromEntries(
                  country.blue_card.map((b) => [
                    `Blue Card (${b.kind})`,
                    `${money(b.min_gross_monthly as number, currency)}${b.official ? "" : " (not official)"}`,
                  ])
                ),
                ...(country.blue_card_next
                  ? {
                      [`From ${country.blue_card_next.starts || "next year"}`]:
                        money(
                          country.blue_card_next.min_gross_monthly as number,
                          currency
                        ),
                    }
                  : {}),
              }}
            />
            {country.contract_rule && (
              <p className="text-[13px] text-muted-foreground">
                {country.contract_rule}
              </p>
            )}
          </CardContent>
        </Card>

        {city.wages && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Wages</CardTitle>
              <CardDescription>
                <Source block={city.wages} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Figures block={city.wages} />
            </CardContent>
          </Card>
        )}

        {(city.notes ||
          Object.keys(city.prices).length > 0 ||
          city.aliases.length > 0) && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(city.prices).length > 0 && (
                <Figures block={city.prices} />
              )}
              {city.aliases.length > 0 && (
                <p className="text-[13px] text-muted-foreground">
                  Also written: {city.aliases.join(", ")}
                </p>
              )}
              {city.notes && <p className="text-[13.5px]">{city.notes}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
