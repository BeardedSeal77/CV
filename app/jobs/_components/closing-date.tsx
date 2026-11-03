"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { JobSummary } from "@/lib/jobhunt/view"

import { action } from "./api"
import { today } from "./status"

/** Days from today to the closing date; negative once it has passed */
export function daysUntil(date: string) {
  const ms = Date.parse(`${date}T12:00:00`) - Date.parse(`${today()}T12:00:00`)
  return Math.round(ms / 86_400_000)
}

/** The listing's optional closing date; "Expire closed" on the board moves
 * jobs past it to Expired */
export function ClosingDate({
  job,
  onChanged,
}: {
  job: JobSummary
  onChanged: () => Promise<void>
}) {
  const saved = job.dates.deadline
  const [value, setValue] = useState(saved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function save(deadline: string) {
    setBusy(true)
    setError("")
    try {
      await action("jobs.update", { id: job.id, deadline })
      setValue(deadline)
      await onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="mt-3 space-y-1"
      onSubmit={(e) => {
        e.preventDefault()
        save(value)
      }}
    >
      <Label
        htmlFor="closing-date"
        className="font-mono text-[11.5px] font-normal tracking-[0.02em] text-muted-foreground"
      >
        Listing closes (only if it says)
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="closing-date"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-38 shrink-0"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={busy || value === saved}
        >
          Save
        </Button>
        {saved && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => save("")}
          >
            Clear
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
