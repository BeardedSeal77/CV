"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { JobDetail } from "@/lib/jobhunt/view"

import { action } from "./api"
import { CopyButton } from "./copy-button"
import { JobsHeader } from "./jobs-header"
import { PayCheckPanel } from "./pay-check"
import { fmtDate, StatusPill, today } from "./status"

/** A text field that saves through one backend action */
function Editor({
  title,
  description,
  initial,
  rows,
  save,
  children,
}: {
  title: string
  description?: string
  initial: string
  rows: number
  save: (text: string) => Promise<unknown>
  children?: React.ReactNode
}) {
  const [text, setText] = useState(initial)
  const [state, setState] = useState("")
  const id = title.toLowerCase().replaceAll(" ", "-")
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <Label htmlFor={id}>{title}</Label>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{state}</span>
          {children}
          <Button
            size="sm"
            variant={text !== initial ? "default" : "outline"}
            onClick={async () => {
              setState("Saving...")
              try {
                await save(text)
                setState("Saved")
              } catch (err) {
                setState((err as Error).message)
              }
            }}
          >
            Save
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Textarea
          id={id}
          value={text}
          rows={rows}
          onChange={(e) => {
            setText(e.target.value)
            setState("")
          }}
          className="font-mono text-[13px] leading-relaxed"
        />
      </CardContent>
    </Card>
  )
}

/** One job in full: its timeline, and the letter, description and notes to edit */
export function JobPage({ id }: { id: string }) {
  const [job, setJob] = useState<JobDetail | null>(null)
  const [error, setError] = useState("")
  const [update, setUpdate] = useState({ date: today(), note: "", link: "" })

  const load = useCallback(() => action<JobDetail>("jobs.get", { id }), [id])

  useEffect(() => {
    load()
      .then(setJob)
      .catch((err) => setError((err as Error).message))
  }, [load])

  if (!job) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {error || (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading the job...
          </>
        )}
      </p>
    )
  }

  const events = [...job.events].reverse()

  return (
    <>
      <JobsHeader title={job.company}>
        <span className="text-muted-foreground">{job.role}</span>
        <StatusPill status={job.status} />
      </JobsHeader>

      <PayCheckPanel check={job.pay_check} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card size="sm" className="self-start">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Status changes happen on the{" "}
              <Link href="/jobs" className="underline">
                board
              </Link>
              : drag the card, or use Move in its dialog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="divide-y text-sm">
              {!events.length && (
                <li className="py-2 text-muted-foreground">No updates yet.</li>
              )}
              {events.map((e, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 py-2.5"
                >
                  <span className="pt-0.5 font-mono text-xs text-muted-foreground">
                    {fmtDate(e.date)}
                  </span>
                  <span className="grid justify-items-start gap-1">
                    {e.status && <StatusPill status={e.status} />}
                    {e.note && <span>{e.note}</span>}
                    {e.link && (
                      <a
                        href={e.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Open link
                        <ExternalLink className="ml-1 inline size-3" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <form
              className="grid gap-2 border-t pt-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!update.note.trim()) return
                setError("")
                try {
                  await action("jobs.log_event", {
                    id,
                    date: update.date,
                    note: update.note.trim(),
                    ...(update.link.trim() ? { link: update.link.trim() } : {}),
                  })
                  setUpdate({ date: today(), note: "", link: "" })
                  setJob(await load())
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              <Label htmlFor="update-note">Add an update</Label>
              <Textarea
                id="update-note"
                rows={2}
                value={update.note}
                onChange={(e) => setUpdate({ ...update, note: e.target.value })}
                placeholder="What happened: email from a recruiter, an assessment sent..."
              />
              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  aria-label="Date"
                  value={update.date}
                  onChange={(e) =>
                    setUpdate({ ...update, date: e.target.value })
                  }
                  className="w-38 shrink-0"
                />
                <Input
                  type="url"
                  aria-label="Link"
                  value={update.link}
                  onChange={(e) =>
                    setUpdate({ ...update, link: e.target.value })
                  }
                  placeholder="Optional link: email thread, invite"
                  className="min-w-0 flex-1"
                />
                <Button type="submit" size="sm">
                  Add update
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Editor
            title="Cover letter"
            description="Only this is printed: name, contact line, date, then the letter."
            initial={job.letter.text}
            rows={20}
            save={(text) => action("jobs.set_letter", { id, text })}
          >
            <CopyButton text={job.letter.text} label="Copy" />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/jobs/${id}/letter`} target="_blank" />}
            >
              Preview
            </Button>
          </Editor>
          <Editor
            title="Letter prep notes"
            description="Private: kept with the letter, never printed."
            initial={job.letter.notes}
            rows={5}
            save={async (notes) => {
              const { text } = await action<{ text: string }>(
                "jobs.get_letter",
                { id }
              )
              return action("jobs.set_letter", { id, text, notes })
            }}
          />
          <Editor
            title="Job description"
            initial={job.description}
            rows={12}
            save={(text) =>
              action("jobs.set_document", { id, doc: "jd", text })
            }
          />
          <Editor
            title="Job description in English"
            initial={job.description_en}
            rows={8}
            save={(text) =>
              action("jobs.set_document", { id, doc: "jd_en", text })
            }
          />
          <Editor
            title="Interview prep"
            initial={job.notes}
            rows={6}
            save={(text) =>
              action("jobs.set_document", { id, doc: "notes", text })
            }
          />
        </div>
      </div>
    </>
  )
}
