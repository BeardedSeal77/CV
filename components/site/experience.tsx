import { AchievementTiles, TechStrip } from "@/components/site/graphics"
import { MetaRow, MoreDetail, Section } from "@/components/site/section"
import type { ExperienceEntry } from "@/lib/content"

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

export function Experience({
  entries,
  timeline,
}: {
  entries: ExperienceEntry[]
  // The career timeline, drawn above the roles
  timeline?: React.ReactNode
}) {
  return (
    <Section id="experience" title="Experience">
      {timeline}
      <ol>
        {entries.map((entry) => (
          <li
            key={entry.company}
            className="border-b py-7 last:border-b-0 doc:py-2"
          >
            <MetaRow meta={<Dates entry={entry} />}>
              <h3 className="text-[19px] leading-snug font-semibold tracking-[-0.01em] doc:text-[17px]">
                {entry.role}{" "}
                <span className="font-normal text-muted-foreground">
                  · {entry.company}
                </span>
              </h3>

              {/* Results as tiles, else highlights, else the one-line summary;
                  the full paragraph stays behind "More detail" on the website */}
              {entry.achievements?.length ? (
                <AchievementTiles items={entry.achievements} />
              ) : entry.highlights?.length ? (
                <ul className="mt-3.5 max-w-[720px] list-disc space-y-2 pl-[18px] text-[15px] leading-normal marker:text-muted-foreground doc:mt-1.5 doc:max-w-none doc:space-y-1">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              ) : entry.summary ? (
                <p className="mt-2 max-w-[720px] text-[15px] doc:mt-1 doc:max-w-none">
                  {entry.summary}
                </p>
              ) : (
                <div
                  className="markdown mt-2.5 max-w-[720px] text-[15px] text-foreground/85 doc:mt-1"
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
              )}
              {(entry.achievements?.length ||
                entry.highlights?.length ||
                entry.summary) && <MoreDetail html={entry.html} />}

              {/* Print leaves the stack to Skills */}
              <TechStrip items={entry.tags} className="doc:hidden" />
            </MetaRow>
          </li>
        ))}
      </ol>
    </Section>
  )
}
