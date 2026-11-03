"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  COLUMN_LABEL,
  COLUMN_OF,
  COLUMNS,
  type Status,
  statusesIn,
} from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"

import { action, actionLabel, type Lifecycle } from "./api"
import { today } from "./status"

/** Move a job to its next step, or anywhere at all to fix a mistake */
export function MoveCard({
  job,
  lifecycle,
  onMoved,
}: {
  job: JobSummary
  lifecycle: Lifecycle
  onMoved: () => Promise<void>
}) {
  const [status, setStatus] = useState<Status | "">("")
  const [date, setDate] = useState(today)
  // Lets the move skip the usual order of the process
  const [correction, setCorrection] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function move(e: React.FormEvent) {
    e.preventDefault()
    if (!status) return
    setBusy(true)
    setError("")
    try {
      await action("jobs.move", {
        id: job.id,
        column: COLUMN_OF[status],
        status,
        date,
        ...(correction ? { correction: true } : {}),
      })
      setStatus("")
      setCorrection(false)
      await onMoved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Move</CardTitle>
        <CardDescription>
          The usual next steps for {job.status}. Dragging the card on the board
          does the same.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={move}>
          <Label htmlFor="move-status" className="sr-only">
            Next step
          </Label>
          <NativeSelect
            id="move-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full"
          >
            <NativeSelectOption value="">
              Choose the next step
            </NativeSelectOption>
            {correction
              ? COLUMNS.map((column) => {
                  const others = statusesIn(column).filter(
                    (s) => s !== job.status
                  )
                  return (
                    others.length > 0 && (
                      <NativeSelectOptGroup
                        key={column}
                        label={COLUMN_LABEL[column]}
                      >
                        {others.map((s) => (
                          <NativeSelectOption key={s} value={s}>
                            {s}
                          </NativeSelectOption>
                        ))}
                      </NativeSelectOptGroup>
                    )
                  )
                })
              : (lifecycle[job.status] ?? []).map((step) => (
                  <NativeSelectOption key={step.action} value={step.to}>
                    {actionLabel(step.action)}: {step.to} (
                    {COLUMN_LABEL[COLUMN_OF[step.to]]})
                  </NativeSelectOption>
                ))}
          </NativeSelect>
          <div className="flex items-center gap-2">
            <Label htmlFor="move-date" className="sr-only">
              Date
            </Label>
            <Input
              id="move-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button type="submit" size="sm" disabled={busy || !status}>
              Move
            </Button>
          </div>
          <Label className="font-normal text-muted-foreground">
            <Checkbox
              checked={correction}
              onCheckedChange={(checked) => {
                setCorrection(checked)
                setStatus("")
              }}
            />
            Fix a mistake: allow any status, skipping the usual order
          </Label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
