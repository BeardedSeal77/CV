"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COLUMN_LABEL, METHOD_LABEL } from "@/lib/jobhunt/schema"
import type { JobDetail } from "@/lib/jobhunt/view"

import { action, type Lifecycle } from "./api"
import { ApplicationFiles } from "./application-files"
import { ClosingDate } from "./closing-date"
import { CopyButton } from "./copy-button"
import { InterestPicker } from "./interest"
import { JobDescription } from "./job-description"
import { MoveCard } from "./move-card"
import { PayCheckPanel } from "./pay-check"
import { COUNTRY, Dot, fmtDate, StatusPill, today } from "./status"

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11.5px] tracking-[0.02em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[14px] break-words">
        {children || <span className="text-muted-foreground">Not known</span>}
      </dd>
    </div>
  )
}

/** Log another interview round on the job's timeline */
function LogInterview({
  id,
  onLogged,
}: {
  id: string
  onLogged: () => Promise<void>
}) {
  const [round, setRound] = useState({ date: today(), note: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  return (
    <form
      className="mt-2 space-y-1"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError("")
        try {
          await action("jobs.log_event", {
            id,
            status: "Interview",
            date: round.date,
            note: round.note || "Interview round.",
          })
          setRound({ date: today(), note: "" })
          await onLogged()
        } catch (err) {
          setError(
            `${(err as Error).message} Use Move with "Fix a mistake" ticked to set it anyway.`
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="round-date" className="sr-only">
          Interview date
        </Label>
        <Input
          id="round-date"
          type="date"
          value={round.date}
          onChange={(e) => setRound((r) => ({ ...r, date: e.target.value }))}
          className="w-38 shrink-0"
        />
        <Label htmlFor="round-note" className="sr-only">
          Note
        </Label>
        <Input
          id="round-note"
          placeholder="e.g. Technical, 2nd round"
          value={round.note}
          onChange={(e) => setRound((r) => ({ ...r, note: e.target.value }))}
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={busy}>
          Log interview
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}

/** Everything about one job: facts, dates, links, the letter and the PDFs */
export function JobDialog({
  id,
  onClose,
  onChanged,
  version,
  lifecycle,
}: {
  id: string | null
  onClose: () => void
  onChanged: () => Promise<void>
  version: string
  lifecycle: Lifecycle
}) {
  const [job, setJob] = useState<JobDetail | null>(null)
  const [error, setError] = useState("")

  // Load the job, and reload it when the board's files change underneath
  useEffect(() => {
    if (!id) return
    let live = true
    action<JobDetail>("jobs.get", { id })
      .then((data) => live && setJob(data))
      .catch((err) => live && setError((err as Error).message))
    return () => {
      live = false
    }
  }, [id, version])

  async function reload() {
    if (!id) return
    setJob(await action<JobDetail>("jobs.get", { id }))
    await onChanged()
  }

  const place = job
    ? [job.city, COUNTRY[job.country] ?? job.country].filter(Boolean).join(", ")
    : ""

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
          setJob(null)
          setError("")
        }
      }}
    >
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        {!job ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            {error ? null : <Loader2 className="size-4 animate-spin" />}
            <DialogTitle className="text-sm font-normal">
              {error || "Loading the job..."}
            </DialogTitle>
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={job.status} />
                {COLUMN_LABEL[job.column] !== job.status && (
                  <span className="font-mono text-[12px] text-muted-foreground">
                    in {COLUMN_LABEL[job.column]}
                  </span>
                )}
                <InterestPicker job={job} onChanged={reload} />
              </div>
              <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight">
                {job.company}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[15px] text-foreground/80">
                {job.role}
                {place && (
                  <span className="text-muted-foreground">
                    <Dot />
                    {place}
                  </span>
                )}
              </DialogDescription>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="space-y-4">
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>The role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <Fact label="Country">
                        {COUNTRY[job.country] ?? job.country}
                      </Fact>
                      <Fact label="City">{job.city}</Fact>
                      <Fact label="Pay">{job.pay}</Fact>
                      <Fact label="Hours">{job.hours}</Fact>
                      <Fact label="Work mode">{job.mode}</Fact>
                      <Fact label="Applying via">
                        {METHOD_LABEL[job.method]}
                        {job.platform &&
                          job.platform !== METHOD_LABEL[job.method] && (
                            <span className="text-muted-foreground">
                              <Dot />
                              {job.platform}
                            </span>
                          )}
                      </Fact>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <CopyButton
                        text={job.website}
                        label="Copy company website"
                      />
                      <CopyButton
                        text={job.url}
                        label="Copy application link"
                      />
                      {job.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          Open listing
                          <ExternalLink data-icon="inline-end" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <Fact label="Listed">{fmtDate(job.dates.listed)}</Fact>
                      <Fact label="Added to the board">
                        {fmtDate(job.dates.added)}
                      </Fact>
                      <Fact label="Applied">{fmtDate(job.dates.applied)}</Fact>
                      <Fact label="Accepted / declined">
                        {job.dates.outcome && (
                          <>
                            {job.dates.outcome.status}
                            <Dot />
                            {fmtDate(job.dates.outcome.date)}
                          </>
                        )}
                      </Fact>
                    </dl>
                    <ClosingDate
                      key={`${job.id}-${job.dates.deadline}`}
                      job={job}
                      onChanged={reload}
                    />
                    <div className="mt-3">
                      <p className="font-mono text-[11.5px] text-muted-foreground">
                        Interviews
                      </p>
                      {job.dates.interviews.length ? (
                        <ol className="mt-1 space-y-1 text-[14px]">
                          {job.dates.interviews.map((round) => (
                            <li key={`${round.date}-${round.note}`}>
                              <span className="font-mono text-[12.5px]">
                                {fmtDate(round.date)}
                              </span>
                              <span className="text-muted-foreground">
                                <Dot />
                                {round.status}
                              </span>
                              {round.note && (
                                <span>
                                  <Dot />
                                  {round.note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-1 text-[14px] text-muted-foreground">
                          None yet
                        </p>
                      )}
                      <LogInterview id={job.id} onLogged={reload} />
                    </div>
                  </CardContent>
                </Card>

                <MoveCard
                  key={job.id}
                  job={job}
                  lifecycle={lifecycle}
                  onMoved={reload}
                />
              </div>

              <div className="space-y-4">
                <PayCheckPanel check={job.pay_check} />
                <ApplicationFiles job={job} />

                <JobDescription
                  original={job.description}
                  english={job.description_en}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
