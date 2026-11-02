import { MetaRow, Section } from "@/components/site/section"
import type { CertificationItem, EducationEntry } from "@/lib/content"

interface EducationProps {
  entries: EducationEntry[]
  certifications: CertificationItem[]
}

export function Education({ entries, certifications }: EducationProps) {
  return (
    <Section id="education" title="Education">
      <ol>
        {entries.map((entry) => (
          <li key={entry.degree} className="border-b py-6">
            <MetaRow meta={entry.dates}>
              <h3 className="text-[17px] leading-snug font-semibold">
                {entry.degree}{" "}
                <span className="font-normal text-muted-foreground">
                  · {entry.institution}
                </span>
              </h3>
              {(entry.status || entry.award) && (
                <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                  {[entry.status, entry.award && `Award: ${entry.award}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {entry.html && (
                <div
                  className="markdown mt-2.5 max-w-[720px] text-[15px] text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
              )}
            </MetaRow>
          </li>
        ))}
      </ol>

      {certifications.length > 0 && (
        <MetaRow meta="Certificates" className="pt-6">
          <ul className="grid gap-x-10 md:grid-cols-2">
            {certifications.map((certification) => (
              <li
                key={certification.title}
                className="flex items-baseline justify-between gap-4 border-b py-2.5 text-[15px]"
              >
                <span>
                  {certification.title}
                  {certification.detail && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {certification.detail}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[13px] text-muted-foreground">
                  {certification.year}
                </span>
              </li>
            ))}
          </ul>
        </MetaRow>
      )}
    </Section>
  )
}
