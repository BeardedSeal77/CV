"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

import { COUNTRY } from "./status"

const PLATFORMS = ["Workable", "Lever", "Ashby", "Teamtailor", "Indeed", "LinkedIn", "justjoin.it", "Company site", "Email", "Recruiter", "Other"]

const FIELDS: { key: string; label: string; type?: string; placeholder?: string }[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "city", label: "City" },
  { key: "url", label: "Listing link", type: "url", placeholder: "https://" },
  { key: "email", label: "Apply email", type: "email" },
  { key: "pay", label: "Pay", placeholder: "€4,000–6,000 / month gross" },
  { key: "mode", label: "Work mode", placeholder: "Hybrid, 3 office days" },
  { key: "posted", label: "Posted", type: "date" },
  { key: "deadline", label: "Deadline", type: "date" },
  { key: "size", label: "Company size" },
  { key: "what", label: "What they do" },
]

const field = "w-full min-w-0 rounded-md border bg-background px-2.5 py-1.5 text-sm text-foreground"

export function NewOpportunityForm() {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({
    country: "LV",
    platform: "Company site",
    fit: "Good",
  })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (key: string) => (e: { target: { value: string } }) =>
    setValues({ ...values, [key]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setError(data.error ?? "Couldn't save.")
    router.push(`/jobs/${data.id}`)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Country
        <select value={values.country} onChange={set("country")} className={field}>
          {Object.entries(COUNTRY).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Platform
        <select value={values.platform} onChange={set("platform")} className={field}>
          {PLATFORMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Fit
        <select value={values.fit} onChange={set("fit")} className={field}>
          {["Strong", "Good", "Stretch"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      {FIELDS.map((f) => (
        <label key={f.key} className="grid gap-1 text-xs text-muted-foreground">
          {f.label}
          <input
            type={f.type ?? "text"}
            required={f.key === "company" || f.key === "role"}
            value={values[f.key] ?? ""}
            onChange={set(f.key)}
            placeholder={f.placeholder}
            className={field}
          />
        </label>
      ))}
      <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
        Job description
        <textarea rows={8} value={values.jd ?? ""} onChange={set("jd")} placeholder="Paste the job description or a summary" className={field} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add opportunity"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  )
}
