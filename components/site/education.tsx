import { Award } from "lucide-react"

import { Section } from "@/components/site/section"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CertificationItem, EducationEntry } from "@/lib/content"

interface EducationProps {
  entries: EducationEntry[]
  certifications: CertificationItem[]
}

export function Education({ entries, certifications }: EducationProps) {
  return (
    <Section id="education" title="Education">
      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.degree}>
            <CardHeader>
              <CardTitle className="text-lg">{entry.degree}</CardTitle>
              <CardDescription className="font-medium text-primary">
                {entry.institution}
              </CardDescription>
              {(entry.status || entry.award) && (
                <CardAction className="flex flex-wrap justify-end gap-1.5">
                  {entry.status && <Badge>{entry.status}</Badge>}
                  {entry.award && (
                    <Badge variant="outline">
                      <Award />
                      {entry.award}
                    </Badge>
                  )}
                </CardAction>
              )}
            </CardHeader>
            {entry.html && (
              <CardContent>
                <div
                  className="markdown text-sm text-foreground/80"
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <h3 className="mt-10 mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
        Certificates & Achievements
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {certifications.map((certification) => (
          <div
            key={certification.title}
            className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div>
              <p className="text-sm font-medium">{certification.title}</p>
              {certification.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {certification.detail}
                </p>
              )}
            </div>
            <Badge variant="outline">{certification.year}</Badge>
          </div>
        ))}
      </div>
    </Section>
  )
}
