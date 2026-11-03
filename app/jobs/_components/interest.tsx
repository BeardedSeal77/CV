"use client"

import { useState } from "react"

import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { type Interest, INTERESTS } from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"

import { action } from "./api"

// The band's marker on the board: the keener, the stronger the colour
export const INTEREST_TONE: Record<Interest, string> = {
  High: "bg-primary",
  Medium: "bg-domain-automation",
  Low: "bg-muted-foreground/40",
}

/** Change how keen Ed is on a job; the board moves it to that band */
export function InterestPicker({
  job,
  onChanged,
}: {
  job: JobSummary
  onChanged: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  return (
    <div className="flex items-center gap-1.5">
      <Label
        htmlFor="job-interest"
        className="font-mono text-[12px] font-normal text-muted-foreground"
      >
        Interest
      </Label>
      <NativeSelect
        id="job-interest"
        size="sm"
        value={job.interest}
        disabled={busy}
        onChange={async (e) => {
          setBusy(true)
          setError("")
          try {
            await action("jobs.update", {
              id: job.id,
              interest: e.target.value,
            })
            await onChanged()
          } catch (err) {
            setError((err as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        {INTERESTS.map((i) => (
          <NativeSelectOption key={i}>{i}</NativeSelectOption>
        ))}
      </NativeSelect>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  )
}
