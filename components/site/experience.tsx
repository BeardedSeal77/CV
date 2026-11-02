import {
  MetaRow,
  MoreDetail,
  Section,
  StackLine,
} from "@/components/site/section"
import { ProjectCard } from "@/components/site/projects"
import type { ExperienceEntry, Project } from "@/lib/content"
import { cn } from "@/lib/utils"

function Dates({ entry }: { entry: ExperienceEntry }) {
  return (
    <>
      <p>{entry.dates}</p>
      {entry.current && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-primary doc:mt-0.5">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          Current
        </p>
      )}
    </>
  )
}

const prose =
  "markdown mt-2.5 max-w-[720px] text-[15px] text-foreground/85 doc:mt-1"

export function Experience({
  entries,
  projects = [],
}: {
  entries: ExperienceEntry[]
  // Printed documents show a linked project compactly under its role
  projects?: Project[]
}) {
  return (
    <Section id="experience" title="Experience">
      <ol>
        {entries.map((entry) => (
          <li
            key={entry.company}
            className="border-b py-7 last:border-b-0 doc:py-3"
          >
            <MetaRow meta={<Dates entry={entry} />}>
              <h3 className="text-[19px] leading-snug font-semibold tracking-[-0.01em] doc:text-[17px]">
                {entry.role}{" "}
                <span className="font-normal text-muted-foreground">
                  · {entry.company}
                </span>
              </h3>

              {entry.highlights?.length ? (
                <>
                  <ul className="mt-3.5 max-w-[720px] list-disc space-y-2 pl-[18px] text-[15px] leading-normal marker:text-muted-foreground doc:mt-1.5 doc:max-w-none doc:space-y-1">
                    {entry.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <MoreDetail html={entry.html} />
                </>
              ) : (
                <>
                  {/* Print uses the short summary; the website keeps the full paragraph */}
                  {entry.summary && (
                    <p className={cn(prose, "hidden doc:block")}>
                      {entry.summary}
                    </p>
                  )}
                  <div
                    className={cn(prose, entry.summary && "doc:hidden")}
                    dangerouslySetInnerHTML={{ __html: entry.html }}
                  />
                </>
              )}

              {/* A role with a linked project prints that project's stack instead */}
              <div className={cn(entry.project && "doc:hidden")}>
                <StackLine items={entry.tags} />
              </div>
              {projects
                .filter((project) => project.slug === entry.project)
                .map((project) => (
                  <div key={project.slug} className="hidden doc:mt-2 doc:block">
                    <ProjectCard project={project} />
                  </div>
                ))}
            </MetaRow>
          </li>
        ))}
      </ol>
    </Section>
  )
}
