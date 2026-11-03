"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, FileText, Loader2, PencilLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { JobDetail } from "@/lib/jobhunt/view"

import { action } from "./api"
import { CopyButton } from "./copy-button"

// Every PDF a form might ask for; the letter alone sits on the letter's card
const DOWNLOADS: { label: string; kind: string; letter: boolean }[] = [
  { label: "CV", kind: "cv", letter: false },
  { label: "Letter + CV", kind: "application", letter: true },
  { label: "Portfolio", kind: "portfolio", letter: false },
  { label: "CV + portfolio", kind: "cv_portfolio", letter: false },
  { label: "All three", kind: "application_portfolio", letter: true },
]

function Spinner() {
  return <Loader2 data-icon="inline-start" className="animate-spin" />
}

/** The cover letter and the application PDFs, built by the backend and downloaded */
export function ApplicationFiles({ job }: { job: JobDetail }) {
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")

  async function download(label: string, kind: string) {
    setBusy(label)
    setError("")
    try {
      const built = await action<{ name: string }>("jobs.build_pdf", {
        id: job.id,
        kind,
      })
      const a = document.createElement("a")
      a.href = `/api/pdf/${job.id}?name=${encodeURIComponent(built.name)}`
      a.download = built.name
      document.body.append(a)
      a.click()
      a.remove()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy("")
    }
  }

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Cover letter</CardTitle>
          <CardDescription>
            {job.letter.text
              ? "Written by Claude Code from the job description and your CV."
              : "None yet: ask Claude Code to write one (jobs_set_letter)."}
          </CardDescription>
          <CardAction className="flex gap-1.5">
            <CopyButton text={job.letter.text} label="Copy" />
            <Button
              variant="outline"
              size="sm"
              disabled={!job.letter.text || Boolean(busy)}
              onClick={() => download("letter", "letter")}
            >
              {busy === "letter" ? (
                <Spinner />
              ) : (
                <Download data-icon="inline-start" />
              )}
              PDF
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          {job.letter.text && (
            <div className="max-h-72 overflow-y-auto rounded-md border bg-background p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap">
              {job.letter.text}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/jobs/${job.id}`} />}
          >
            <PencilLine data-icon="inline-start" />
            Edit the letter, description and notes
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Application PDFs</CardTitle>
          <CardDescription>
            Printed from this server in the CV&apos;s own design, each as its
            own file, for forms that want them separately or in one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {DOWNLOADS.map((d) => (
            <Button
              key={d.label}
              variant={d.kind === "application" ? "default" : "outline"}
              disabled={Boolean(busy) || (d.letter && !job.letter.text)}
              onClick={() => download(d.label, d.kind)}
            >
              {busy === d.label ? (
                <Spinner />
              ) : (
                <FileText data-icon="inline-start" />
              )}
              {d.label}
            </Button>
          ))}
          {error && (
            <p className="col-span-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
