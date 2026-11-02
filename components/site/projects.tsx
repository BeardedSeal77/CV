import { ExternalLink } from "lucide-react"

import { linkClass } from "@/components/site/hero"
import { ProofStrip } from "@/components/site/proof-strip"
import { MoreDetail, Section, StackLine } from "@/components/site/section"
import type { Capability, Project } from "@/lib/content"
import { withBasePath } from "@/lib/paths"
import { cn } from "@/lib/utils"

// "Developer Workbench • SQL-First" + status -> "Developer Workbench · SQL-First · In daily use"
export function eyebrow(project: Project) {
  return [project.subtitle.replaceAll(" • ", " · "), project.status]
    .filter(Boolean)
    .join(" · ")
}

// A project is pitched as a capability grid when its capabilities name a stage
export function isGridPitch(project: Project) {
  return Boolean(project.pitch?.capabilities?.some((item) => item.group))
}

function groupByStage(capabilities: Capability[]) {
  const groups = new Map<string, Capability[]>()
  for (const capability of capabilities) {
    const group = capability.group ?? "Other"
    groups.set(group, [...(groups.get(group) ?? []), capability])
  }
  return [...groups.entries()]
}

// Stages as columns, written column by column so extracted text reads stage by stage
export function CapabilityGrid({
  capabilities,
  className,
}: {
  capabilities: Capability[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-x-7 gap-y-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] doc:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] doc:gap-x-5 doc:gap-y-2",
        className
      )}
    >
      {groupByStage(capabilities).map(([stage, items]) => (
        <div key={stage}>
          <h4 className="mb-1 font-mono text-xs font-medium tracking-[0.08em] text-primary uppercase doc:mb-0.5">
            {stage}
          </h4>
          <ul>
            {items.map((item) => (
              <li key={item.title} className="border-t py-3 doc:py-1.5">
                <p className="text-[14.5px] leading-snug font-semibold">
                  {item.title}
                  {item.planned && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · in development
                    </span>
                  )}
                </p>
                {item.value && (
                  <p className="mt-0.5 text-[13.5px] leading-normal text-muted-foreground doc:leading-snug">
                    {item.value}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Links({ project }: { project: Project }) {
  const links = [
    ...(project.caseStudy
      ? [
          {
            label: "Case study and demo",
            href: withBasePath(project.caseStudy),
          },
        ]
      : []),
    ...(project.links ?? []),
  ]
  if (links.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className={cn(linkClass, "inline-flex items-center gap-1")}
        >
          {link.label}
          {link.href.startsWith("http") && (
            <ExternalLink aria-hidden className="size-3.5" />
          )}
        </a>
      ))}
    </div>
  )
}

// The flagship: problem, capabilities by stage, proof, stack
export function PitchBlock({ project }: { project: Project }) {
  const pitch = project.pitch!
  return (
    <article
      id={project.slug}
      className="mt-7 scroll-mt-20 rounded-lg border bg-card p-6 md:p-8 doc:mt-3 doc:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <div className="min-w-0 flex-[1_1_32rem]">
          <p className="font-mono text-[12.5px] text-muted-foreground">
            {eyebrow(project)}
          </p>
          <h3 className="mt-1.5 text-[26px] leading-tight font-semibold tracking-[-0.02em] md:text-[30px] doc:mt-0.5 doc:text-[24px]">
            {project.title}
          </h3>
          <p className="mt-2.5 max-w-[680px] text-lg leading-normal doc:mt-1 doc:max-w-none doc:text-base">
            {pitch.problem}
          </p>
        </div>
        <div className="doc:hidden">
          <Links project={project} />
        </div>
      </div>

      <CapabilityGrid
        capabilities={pitch.capabilities ?? []}
        className="mt-7 doc:mt-3"
      />

      {pitch.proof && <ProofStrip items={pitch.proof} variant="inline" />}
      <StackLine items={project.tags} />
      <MoreDetail html={project.html} label="How it works" />
    </article>
  )
}

export function Chips({
  items,
}: {
  items: { title: string; planned?: boolean }[]
}) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2 text-[13.5px] doc:mt-2.5 doc:gap-1.5">
      {items.map((item) => (
        <li
          key={item.title}
          className={cn(
            "rounded-md border px-2.5 py-1.5 doc:py-0.5",
            item.planned && "border-dashed text-muted-foreground"
          )}
        >
          {item.title}
          {item.planned && " · in development"}
        </li>
      ))}
    </ul>
  )
}

// Compact project: problem or description, traction, feature chips
export function ProjectCard({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  const chips =
    project.pitch?.capabilities ?? project.features?.map((title) => ({ title }))

  return (
    <article
      id={project.slug}
      className={cn(
        "flex h-full scroll-mt-20 flex-col rounded-lg border p-6 md:px-8 md:py-7 doc:p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-2">
        <div className="min-w-0 flex-[1_1_24rem]">
          <p className="font-mono text-[12.5px] text-muted-foreground">
            {eyebrow(project)}
          </p>
          <h3 className="mt-1.5 text-2xl leading-tight font-semibold tracking-[-0.015em] doc:mt-0.5 doc:text-[21px]">
            {project.title}
          </h3>
        </div>
        {project.pitch?.proof && (
          <p className="font-mono text-[13px] leading-relaxed md:text-right">
            {project.pitch.proof.map((item, index) => (
              <span key={item.label}>
                {index > 0 && " · "}
                <span
                  className={cn("font-medium", index === 0 && "text-primary")}
                >
                  {item.value}
                </span>{" "}
                <span className="text-muted-foreground">{item.label}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {project.pitch ? (
        <>
          <p className="mt-2.5 max-w-[680px] text-base doc:mt-1 doc:max-w-none">
            {project.pitch.problem}
          </p>
          <MoreDetail html={project.html} />
        </>
      ) : (
        <div
          className="markdown mt-2.5 max-w-[680px] text-[15px] text-foreground/85"
          dangerouslySetInnerHTML={{ __html: project.html }}
        />
      )}

      {chips && <Chips items={chips} />}

      {project.minis && (
        <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {project.minis.map((mini) => (
            <div key={mini.name} className="border-t pt-3">
              <h4 className="text-[14.5px] font-semibold">{mini.name}</h4>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">
                {mini.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-1">
        <StackLine items={project.tags} />
        {project.links && (
          <div className="mt-4 doc:hidden">
            <Links project={{ ...project, caseStudy: undefined }} />
          </div>
        )}
      </div>
    </article>
  )
}

export function Projects({ projects }: { projects: Project[] }) {
  const pitched = projects.filter(isGridPitch)
  const rest = projects.filter((project) => !isGridPitch(project))

  return (
    <Section id="projects" title="Projects">
      {pitched.map((project) => (
        <PitchBlock key={project.title} project={project} />
      ))}
      <div className="mt-5 grid gap-5 md:grid-cols-2 doc:mt-3 doc:gap-3">
        {rest.map((project) => (
          <ProjectCard
            key={project.title}
            project={project}
            className={
              project.pitch || project.minis ? "md:col-span-2" : undefined
            }
          />
        ))}
      </div>
    </Section>
  )
}
