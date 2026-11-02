import {
  MetaRow,
  MoreDetail,
  Section,
  StackLine,
} from "@/components/site/section"
import type { ExperienceEntry } from "@/lib/content"

function Dates({ entry }: { entry: ExperienceEntry }) {
  return (
    <>
      <p>{entry.dates}</p>
      {entry.current && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-primary">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          Current
        </p>
      )}
    </>
  )
}

export function Experience({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <Section id="experience" title="Experience">
      <ol>
        {entries.map((entry) => (
          <li key={entry.company} className="border-b py-7">
            <MetaRow meta={<Dates entry={entry} />}>
              <h3 className="text-[19px] leading-snug font-semibold tracking-[-0.01em]">
                {entry.role}{" "}
                <span className="font-normal text-muted-foreground">
                  · {entry.company}
                </span>
              </h3>

              {entry.highlights?.length ? (
                <>
                  <ul className="mt-3.5 max-w-[720px] list-disc space-y-2 pl-[18px] text-[15px] leading-normal marker:text-muted-foreground">
                    {entry.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <MoreDetail html={entry.html} />
                </>
              ) : (
                <div
                  className="markdown mt-2.5 max-w-[720px] text-[15px] text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
              )}

              <StackLine items={entry.tags} />
            </MetaRow>
          </li>
        ))}
      </ol>
    </Section>
  )
}
