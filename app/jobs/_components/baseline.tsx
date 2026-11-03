"use client"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BaselineView } from "@/lib/jobhunt/pay"

import { action } from "./api"
import { GradeChip, money } from "./grade"

// The editable fields, in the order they're shown
const TEXT = [
  ["employer", "Employer"],
  ["role", "Role"],
  ["started", "Started (YYYY-MM)"],
] as const
const AMOUNTS = [
  ["gross_monthly", "Gross a month"],
  ["housing", "Housing a month"],
  ["everyday", "Everyday a month"],
  ["fixed", "Fixed costs a month"],
] as const

type Form = Record<string, string>

function toForm(view: BaselineView): Form {
  const b = view.baseline
  return {
    employer: b.employer,
    role: b.role,
    started: b.started,
    gross_monthly: String(b.gross_monthly),
    housing: String(b.costs_monthly.housing),
    everyday: String(b.costs_monthly.everyday),
    fixed: String(b.costs_monthly.fixed),
    notes: b.notes,
  }
}

/** Ed's current job and costs: the yardstick every grade is measured against */
export function BaselineEditor() {
  const [view, setView] = useState<BaselineView | null>(null)
  const [form, setForm] = useState<Form>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  function show(data: BaselineView) {
    setView(data)
    setForm(toForm(data))
  }

  useEffect(() => {
    action<BaselineView>("pay.baseline.get")
      .then(show)
      .catch((err) => setError((err as Error).message))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const payload = {
        ...Object.fromEntries(TEXT.map(([key]) => [key, form[key]])),
        ...Object.fromEntries(AMOUNTS.map(([key]) => [key, Number(form[key])])),
        notes: form.notes,
      }
      show(await action<BaselineView>("pay.baseline.update", payload))
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!view) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {error || (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading the baseline...
          </>
        )}
      </p>
    )
  }

  const currency = view.baseline.currency
  const set = (key: string) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Current job</CardTitle>
          <CardDescription>
            In {view.home_city.name} (cost of living index{" "}
            {view.home_city.col_index}). Net pay is computed from the gross.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            {TEXT.map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`baseline-${key}`}>{label}</Label>
                <Input
                  id={`baseline-${key}`}
                  value={form[key] ?? ""}
                  onChange={set(key)}
                />
              </div>
            ))}
            {AMOUNTS.map(([key, label]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`baseline-${key}`}>
                  {label} ({currency})
                </Label>
                <Input
                  id={`baseline-${key}`}
                  type="number"
                  min={0}
                  step="any"
                  value={form[key] ?? ""}
                  onChange={set(key)}
                />
              </div>
            ))}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="baseline-notes">Notes</Label>
              <Textarea
                id="baseline-notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={set("notes")}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" size="sm" disabled={busy}>
                Save
              </Button>
              {saved && (
                <span className="text-sm text-muted-foreground">
                  Saved. Every grade now uses it.
                </span>
              )}
              {error && (
                <span className="text-sm text-destructive">{error}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card size="sm" className="self-start">
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>What every job is graded against.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 text-[13.5px]">
            <dt className="text-muted-foreground">Net a month</dt>
            <dd className="text-right font-mono text-[12.5px]">
              {money(view.net_monthly, currency)}
            </dd>
            <dt className="text-muted-foreground">Living costs covered</dt>
            <dd className="text-right font-mono text-[12.5px]">
              {view.cover.toFixed(2)}x after housing
            </dd>
          </dl>
          <ul className="space-y-1.5 text-[13.5px]">
            {view.grades.map((g) => (
              <li key={g.grade} className="flex items-center gap-2">
                <GradeChip grade={g.grade} />
                <span>{g.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-muted-foreground">
            A job drops {view.rent_share_penalty.drop_grades} grade when housing
            takes more than {Math.round(view.rent_share_penalty.above * 100)}%
            of net pay.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
