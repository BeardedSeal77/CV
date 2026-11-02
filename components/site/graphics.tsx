// Workbench graphic patterns: domain colours, achievement tiles, domain chips,
// tech logos, the career timeline and the stage pipeline. Every graphic sits on
// real text in reading order, so PDFs still extract and parse cleanly.
import { icons, type LucideIcon } from "lucide-react"
import * as simpleIcons from "simple-icons"

import type {
  Achievement,
  Capability,
  Domain,
  EducationEntry,
  ExperienceEntry,
  Project,
} from "@/lib/content"
import { cn } from "@/lib/utils"

// Literal class names per domain so Tailwind sees them
export const DOMAIN: Record<
  Domain,
  { label: string; chip: string; icon: string; span: string; swatch: string }
> = {
  ai: {
    label: "AI and agents",
    chip: "bg-domain-ai-soft text-domain-ai border-domain-ai/35",
    icon: "bg-domain-ai-soft text-domain-ai border-domain-ai",
    span: "bg-domain-ai-soft text-domain-ai border-domain-ai",
    swatch: "bg-domain-ai-soft border-domain-ai",
  },
  automation: {
    label: "Automation",
    chip: "bg-domain-automation-soft text-domain-automation border-domain-automation/35",
    icon: "bg-domain-automation-soft text-domain-automation border-domain-automation",
    span: "bg-domain-automation-soft text-domain-automation border-domain-automation",
    swatch: "bg-domain-automation-soft border-domain-automation",
  },
  backend: {
    label: "Backend and data",
    chip: "bg-domain-backend-soft text-domain-backend border-domain-backend/35",
    icon: "bg-domain-backend-soft text-domain-backend border-domain-backend",
    span: "bg-domain-backend-soft text-domain-backend border-domain-backend",
    swatch: "bg-domain-backend-soft border-domain-backend",
  },
  frontend: {
    label: "Frontend",
    chip: "bg-domain-frontend-soft text-domain-frontend border-domain-frontend/35",
    icon: "bg-domain-frontend-soft text-domain-frontend border-domain-frontend",
    span: "bg-domain-frontend-soft text-domain-frontend border-domain-frontend",
    swatch: "bg-domain-frontend-soft border-domain-frontend",
  },
  infra: {
    label: "Infrastructure",
    chip: "bg-domain-infra-soft text-domain-infra border-domain-infra/35",
    icon: "bg-domain-infra-soft text-domain-infra border-domain-infra",
    span: "bg-domain-infra-soft text-domain-infra border-domain-infra",
    swatch: "bg-domain-infra-soft border-domain-infra",
  },
  study: {
    label: "Other",
    chip: "bg-domain-study-soft text-domain-study border-domain-study/35",
    icon: "bg-domain-study-soft text-domain-study border-domain-study",
    span: "bg-domain-study-soft text-domain-study border-domain-study",
    swatch: "bg-domain-study-soft border-domain-study",
  },
}

const FALLBACK_ICON: Record<Domain, string> = {
  ai: "Bot",
  automation: "Workflow",
  backend: "Database",
  frontend: "Monitor",
  infra: "Cloud",
  study: "FileText",
}

export function DomainIcon({
  domain = "study",
  icon,
  className,
}: {
  domain?: Domain
  icon?: string
  className?: string
}) {
  const Icon: LucideIcon =
    icons[(icon ?? FALLBACK_ICON[domain]) as keyof typeof icons] ??
    icons[FALLBACK_ICON[domain] as keyof typeof icons]
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border",
        DOMAIN[domain].icon,
        className
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  )
}

// A role's results as tiles instead of bullet sentences
export function AchievementTiles({ items }: { items: Achievement[] }) {
  return (
    <ul className="mt-4 grid max-w-[880px] gap-x-6 gap-y-4 sm:grid-cols-2 doc:mt-2 doc:max-w-none doc:grid-cols-2 doc:gap-y-2">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3">
          <DomainIcon domain={item.domain} icon={item.icon} />
          <div className="min-w-0">
            <p className="text-[14.5px] leading-snug font-semibold">
              {item.title}
            </p>
            {item.detail && (
              <p className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">
                {item.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DomainChip({
  domain = "study",
  children,
  planned,
}: {
  domain?: Domain
  children: React.ReactNode
  planned?: boolean
}) {
  return (
    <li
      className={cn(
        "rounded-md border px-2.5 py-1 text-[13.5px] leading-snug doc:px-2 doc:py-0 doc:text-[13px]",
        planned
          ? "border-dashed border-input text-muted-foreground"
          : DOMAIN[domain].chip
      )}
    >
      {children}
      {planned && " · in development"}
    </li>
  )
}

export function DomainLegend({
  domains,
  className,
}: {
  domains: Domain[]
  className?: string
}) {
  return (
    <ul
      aria-label="Colour key"
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[12px] text-muted-foreground",
        className
      )}
    >
      {domains.map((domain) => (
        <li key={domain} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-3 rounded-[3px] border", DOMAIN[domain].swatch)}
          />
          {DOMAIN[domain].label}
        </li>
      ))}
    </ul>
  )
}

// Simple Icons lookup by title, plus the names this CV writes differently
const LOGOS = new Map<string, { path: string }>()
for (const icon of Object.values(simpleIcons) as {
  title?: string
  path?: string
}[]) {
  if (icon?.title && icon.path)
    LOGOS.set(icon.title.toLowerCase(), { path: icon.path })
}
const LOGO_ALIASES: Record<string, string> = {
  "git & github": "github",
  "linux/wsl": "linux",
  bash: "gnu bash",
  "flask/fastapi": "flask",
  "jira & confluence": "jira",
}
function logoFor(name: string) {
  const key = name.toLowerCase()
  return LOGOS.get(key) ?? LOGOS.get(LOGO_ALIASES[key] ?? "")
}

// Monochrome logos, each with its name written beside it
export function TechStrip({
  items,
  className,
}: {
  items: string[]
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ul
      aria-label="Stack"
      className={cn(
        "mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground doc:mt-1.5",
        className
      )}
    >
      {items.map((item) => {
        const logo = logoFor(item)
        return (
          <li key={item} className="flex items-center gap-1.5">
            {logo && (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0 fill-current text-foreground/80"
              >
                <path d={logo.path} />
              </svg>
            )}
            {item}
          </li>
        )
      })}
    </ul>
  )
}

// --- Timeline -----------------------------------------------------------

// "2021" -> 2021, "2021-06" -> 2021.42; an end year means the end of that year
function toYear(value: string, isEnd: boolean, now: number) {
  if (value === "now") return now
  const [year, month] = value.split("-").map(Number)
  if (month) return year + (isEnd ? month : month - 1) / 12
  return isEnd ? year + 1 : year
}

interface Bar {
  key: string
  label: string
  years: string
  start: number
  end: number
  ongoing: boolean
  tone: string
}

// Where a bar's label goes, and the stretch of track (in %) bar and label occupy
interface Placed extends Bar {
  left: number
  width: number
  place: "inside" | "after" | "before"
  from: number
  to: number
}

// Characters per percent of track: the website's ~1000px track, and the CV
// sheet's narrower one (rows are laid out for the sheet, so both fit)
const CHARS_PER_PCT = { web: 1.5, doc: 1.1 }

function labelChars(bar: Bar) {
  return bar.label.length + bar.years.length + 3
}

function place(bar: Bar, pct: (year: number) => number): Placed {
  const left = pct(bar.start)
  const width = pct(bar.end) - left
  const labelPct = labelChars(bar) / CHARS_PER_PCT.doc
  if (labelPct <= width)
    return {
      ...bar,
      left,
      width,
      place: "inside",
      from: left,
      to: left + width,
    }
  if (left + width + labelPct <= 100)
    return {
      ...bar,
      left,
      width,
      place: "after",
      from: left,
      to: left + width + labelPct,
    }
  return {
    ...bar,
    left,
    width,
    place: "before",
    from: left - labelPct,
    to: left + width,
  }
}

// Greedy rows: a bar joins the first row where neither it nor its label overlaps
function rows(bars: Placed[]) {
  const out: Placed[][] = []
  for (const bar of [...bars].sort((a, b) => a.from - b.from)) {
    const row = out.find((r) =>
      r.every((b) => b.to <= bar.from || b.from >= bar.to)
    )
    if (row) row.push(bar)
    else out.push([bar])
  }
  return out
}

// "2021" + "2023" -> "2021–23"; "2022" + "now" -> "2022–now"
function yearsLabel(start?: string, end?: string) {
  const s = start?.slice(0, 4)
  const e = end === "now" ? "now" : end?.slice(0, 4)
  if (!e || e === s) return `${s}`
  return `${s}–${e !== "now" && e.slice(0, 2) === s?.slice(0, 2) ? e.slice(2) : e}`
}

export function Timeline({
  experience,
  projects,
  education,
  className,
}: {
  experience: ExperienceEntry[]
  projects: Project[]
  education: EducationEntry[]
  className?: string
}) {
  const today = new Date()
  const now =
    today.getFullYear() + today.getMonth() / 12 + today.getDate() / 365

  const bar = (
    key: string,
    label: string,
    span: { start?: string; end?: string },
    tone: string
  ): Bar | null =>
    span.start
      ? {
          key,
          label,
          years: yearsLabel(span.start, span.end),
          start: toYear(span.start, false, now),
          end: toYear(span.end ?? span.start, true, now),
          ongoing: span.end === "now",
          tone,
        }
      : null

  const lanes = [
    {
      name: "Work",
      bars: experience.map((e) =>
        bar(
          e.company,
          e.company,
          e,
          "bg-primary-soft text-foreground border-primary"
        )
      ),
    },
    {
      name: "Projects",
      bars: projects.map((p) =>
        bar(p.slug, p.title, p, DOMAIN[p.domain ?? "study"].span)
      ),
    },
    {
      name: "Study",
      bars: education.map((e) => bar(e.degree, e.degree, e, DOMAIN.study.span)),
    },
  ]
    .map((lane) => ({
      ...lane,
      bars: lane.bars.filter((b): b is Bar => b !== null),
    }))
    .filter((lane) => lane.bars.length > 0)

  const all = lanes.flatMap((lane) => lane.bars)
  if (all.length === 0) return null
  const first = Math.floor(Math.min(...all.map((b) => b.start)))
  const last = Math.ceil(Math.max(...all.map((b) => b.end), now))
  const span = last - first
  const pct = (year: number) => ((year - first) / span) * 100
  const years = Array.from({ length: span + 1 }, (_, i) => first + i)

  return (
    <figure
      aria-label="Career timeline"
      className={cn(
        "mt-6 overflow-x-auto doc:mt-2 doc:overflow-visible",
        className
      )}
    >
      <div className="min-w-[640px] pr-4 doc:min-w-0 doc:pr-3">
        {/* Year axis */}
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 doc:grid-cols-[5rem_minmax(0,1fr)]">
          <div />
          <div aria-hidden className="relative h-6 border-b">
            {years.map((year) => (
              <span
                key={year}
                className="absolute bottom-1 -translate-x-1/2 font-mono text-[11.5px] text-muted-foreground"
                style={{ left: `${pct(year)}%` }}
              >
                {year}
              </span>
            ))}
          </div>
        </div>

        {lanes.map((lane) => (
          <div
            key={lane.name}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 border-b py-2 doc:grid-cols-[5rem_minmax(0,1fr)] doc:py-1"
          >
            <p className="pt-1 font-mono text-[12.5px] text-muted-foreground">
              {lane.name}
            </p>
            <div className="relative">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {years.slice(1, -1).map((year) => (
                  <span
                    key={year}
                    className="absolute inset-y-0 border-l border-dashed"
                    style={{ left: `${pct(year)}%` }}
                  />
                ))}
                <span
                  className="absolute -inset-y-2 border-l-2 border-primary"
                  style={{ left: `${pct(now)}%` }}
                />
              </div>
              <ol className="relative space-y-1 doc:space-y-0.5">
                {rows(lane.bars.map((b) => place(b, pct))).map((row, index) => (
                  <li key={index} className="relative h-7 doc:h-5">
                    <ol>
                      {row.map((b) => {
                        const { left, width } = b
                        // The website's wider track fits more labels inside
                        const web =
                          labelChars(b) <= width * CHARS_PER_PCT.web
                            ? "inside"
                            : b.place
                        const labelAt = (where: string) =>
                          where === "inside"
                            ? { left: `${left}%` }
                            : where === "before"
                              ? { right: `${100 - left}%` }
                              : { left: `${left + width}%` }
                        const label = (where: string, className?: string) => (
                          <span
                            className={cn(
                              "absolute top-0 flex h-7 items-center gap-1.5 text-[12.5px] whitespace-nowrap doc:h-5 doc:text-[12px]",
                              where === "inside" ? "px-2" : "px-1.5",
                              className
                            )}
                            style={labelAt(where)}
                          >
                            <span className="font-semibold">{b.label}</span>
                            <span className="font-mono text-[11px] opacity-80">
                              {b.years}
                            </span>
                          </span>
                        )
                        return (
                          <li key={b.key}>
                            <span
                              aria-hidden
                              className={cn(
                                "absolute top-0 h-7 rounded-md border-[1.5px] doc:h-5 doc:rounded-sm",
                                b.tone,
                                b.ongoing && "rounded-r-none"
                              )}
                              style={{ left: `${left}%`, width: `${width}%` }}
                            />
                            {web === b.place ? (
                              label(web)
                            ) : (
                              <>
                                {label(web, "doc:hidden")}
                                {label(b.place, "hidden doc:flex")}
                              </>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </figure>
  )
}

// --- Pipeline -----------------------------------------------------------

// Stages in order, joined by arrows, with each stage's capabilities beneath
export function Pipeline({
  capabilities,
  className,
}: {
  capabilities: Capability[]
  className?: string
}) {
  const stages = new Map<string, Capability[]>()
  for (const capability of capabilities) {
    const stage = capability.group ?? "Other"
    stages.set(stage, [...(stages.get(stage) ?? []), capability])
  }

  return (
    <ol
      className={cn(
        "grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 doc:grid-cols-4 doc:gap-x-6 doc:gap-y-3",
        className
      )}
    >
      {[...stages.entries()].map(([stage, items], index) => (
        <li key={stage} className="relative min-w-0">
          <p className="relative rounded-md border bg-card px-3 py-2 font-mono text-xs font-medium tracking-[0.08em] text-primary uppercase doc:py-1">
            {index + 1} · {stage}
            {index < stages.size - 1 && (
              <span
                aria-hidden
                className="absolute top-1/2 -right-8 hidden w-8 items-center lg:flex doc:-right-6 doc:flex doc:w-6"
              >
                <span className="h-px flex-1 bg-input" />
                <span className="-ml-1.5 size-1.5 rotate-45 border-t border-r border-input" />
              </span>
            )}
          </p>
          <ul className="mt-3 space-y-3 doc:mt-2 doc:space-y-1.5">
            {items.map((item) => (
              <li key={item.title} className="flex gap-2.5">
                <DomainIcon
                  domain={item.domain}
                  icon={item.icon}
                  className="size-6 [&_svg]:size-3.5"
                />
                <div className="min-w-0">
                  <p className="text-[14px] leading-snug font-semibold">
                    {item.title}
                    {item.planned && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · in development
                      </span>
                    )}
                  </p>
                  {item.value && (
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                      {item.value}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}
