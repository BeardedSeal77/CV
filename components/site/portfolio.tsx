import Image from "next/image"

import { ProofStrip } from "@/components/site/proof-strip"
import {
  CapabilityGrid,
  Chips,
  eyebrow,
  isGridPitch,
} from "@/components/site/projects"
import { StackLine } from "@/components/site/section"
import type { Project } from "@/lib/content"
import { withBasePath } from "@/lib/paths"
import { cn } from "@/lib/utils"

// Screenshots and demos; until a project has media, labelled slots hold the layout
function Media({ project }: { project: Project }) {
  const slots = project.media?.length
    ? project.media
    : ["Overview", "Key screen", "Detail"].map((label) => ({
        src: "",
        alt: label,
      }))

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3 doc:mt-4 doc:grid-cols-3 doc:gap-3">
      {slots.map((item, index) =>
        item.src ? (
          <Image
            key={item.src}
            src={withBasePath(item.src)}
            alt={item.alt}
            width={1280}
            height={800}
            className={cn(
              "aspect-video w-full rounded-lg border object-cover object-top",
              index === 0 && "sm:col-span-3"
            )}
          />
        ) : (
          <div
            key={item.alt}
            className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-input/60 font-mono text-[12.5px] text-muted-foreground"
          >
            {item.alt}: screenshot to come
          </div>
        )
      )}
    </div>
  )
}

function CaseStudy({ project, first }: { project: Project; first: boolean }) {
  const pitch = project.pitch!
  return (
    <article
      id={project.slug}
      className={cn(
        "scroll-mt-20 border-t pt-12 doc:pt-5",
        first ? "mt-8 doc:mt-4" : "print-break mt-20 doc:mt-0 doc:border-t-0"
      )}
    >
      <p className="font-mono text-[12.5px] text-muted-foreground">
        {eyebrow(project)}
      </p>
      <h2 className="mt-1.5 text-[34px] leading-tight font-semibold tracking-[-0.025em] doc:text-[30px]">
        {project.title}
      </h2>
      <p className="mt-3 max-w-[720px] text-xl leading-normal doc:max-w-none doc:text-lg">
        {pitch.problem}
      </p>

      <Media project={project} />

      <h3 className="mt-10 border-b pb-3 text-[15px] font-semibold doc:mt-5 doc:pb-1.5">
        What it does
      </h3>
      {isGridPitch(project) ? (
        <CapabilityGrid
          capabilities={pitch.capabilities ?? []}
          className="mt-5 doc:mt-3"
        />
      ) : (
        pitch.capabilities && <Chips items={pitch.capabilities} />
      )}

      {pitch.proof && <ProofStrip items={pitch.proof} variant="inline" />}

      {project.html && (
        <>
          <h3 className="mt-10 border-b pb-3 text-[15px] font-semibold doc:mt-5 doc:pb-1.5">
            How it works
          </h3>
          <div
            className="markdown mt-4 max-w-[720px] text-[15px] text-foreground/85 doc:mt-2 doc:max-w-none"
            dangerouslySetInnerHTML={{ __html: project.html }}
          />
        </>
      )}
      <StackLine items={project.tags} />
    </article>
  )
}

export function PortfolioProjects({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((project, index) => (
        <CaseStudy key={project.slug} project={project} first={index === 0} />
      ))}
    </>
  )
}
