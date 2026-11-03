"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { INTERESTS, METHOD_LABEL, METHODS } from "@/lib/jobhunt/schema"
import type { JobSummary } from "@/lib/jobhunt/view"

import { action } from "./api"
import { COUNTRY } from "./status"

const FITS = ["Strong", "Good", "Stretch"]

// The listing's free-text fields, in the order they're filled in
const FIELDS: {
  key: string
  label: string
  type?: string
  placeholder?: string
}[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Job title" },
  { key: "city", label: "City" },
  {
    key: "platform",
    label: "Platform",
    placeholder: "e.g. Workable, justjoin.it",
  },
  {
    key: "url",
    label: "Application link",
    type: "url",
    placeholder: "https://",
  },
  {
    key: "website",
    label: "Company website",
    type: "url",
    placeholder: "https://",
  },
  { key: "email", label: "Apply email", type: "email" },
  {
    key: "pay",
    label: "Pay",
    placeholder: "e.g. EUR 4,000-6,000 / month gross",
  },
  { key: "hours", label: "Hours", placeholder: "e.g. Full time, 40 h" },
  {
    key: "mode",
    label: "Work mode",
    placeholder: "e.g. Hybrid, 3 office days",
  },
  { key: "posted", label: "Listed on", type: "date" },
  { key: "deadline", label: "Deadline", type: "date" },
  { key: "size", label: "Company size" },
  { key: "what", label: "What they do" },
]

const EMPTY = { country: "LV", method: "company_site", fit: "Good" }

/** Add a job to the Backlog; Claude Code usually does this over MCP */
export function AddJobDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (job: JobSummary) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(EMPTY)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (key: string) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const job = await action<JobSummary>("jobs.add", values)
      setValues(EMPTY)
      onAdded(job)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add a job</DialogTitle>
          <DialogDescription>
            It lands in the Backlog as Shortlisted.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-job"
          onSubmit={submit}
          className="grid gap-3 sm:grid-cols-3"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="add-country">Country</Label>
            <NativeSelect
              id="add-country"
              value={values.country}
              onChange={set("country")}
              className="w-full"
            >
              {Object.entries(COUNTRY).map(([code, name]) => (
                <NativeSelectOption key={code} value={code}>
                  {name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="add-method">Applying via</Label>
            <NativeSelect
              id="add-method"
              value={values.method}
              onChange={set("method")}
              className="w-full"
            >
              {METHODS.map((m) => (
                <NativeSelectOption key={m} value={m}>
                  {METHOD_LABEL[m]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="add-fit">Fit</Label>
            <NativeSelect
              id="add-fit"
              value={values.fit}
              onChange={set("fit")}
              className="w-full"
            >
              {FITS.map((f) => (
                <NativeSelectOption key={f}>{f}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="add-interest">Interest</Label>
            <NativeSelect
              id="add-interest"
              value={values.interest ?? ""}
              onChange={set("interest")}
              className="w-full"
            >
              <NativeSelectOption value="">From the fit</NativeSelectOption>
              {INTERESTS.map((i) => (
                <NativeSelectOption key={i}>{i}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={`add-${f.key}`}>{f.label}</Label>
              <Input
                id={`add-${f.key}`}
                type={f.type ?? "text"}
                required={f.key === "company" || f.key === "role"}
                value={values[f.key] ?? ""}
                onChange={set(f.key)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <div className="grid gap-1.5 sm:col-span-3">
            <Label htmlFor="add-jd">Job description</Label>
            <Textarea
              id="add-jd"
              rows={7}
              value={values.jd ?? ""}
              onChange={set("jd")}
              placeholder="Paste the job description or a summary"
            />
          </div>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="submit" form="add-job" disabled={busy}>
            {busy && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Add to the Backlog
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
