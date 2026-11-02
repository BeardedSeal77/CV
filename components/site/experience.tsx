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
import type { ExperienceEntry } from "@/lib/content"
import { cn } from "@/lib/utils"

export function Experience({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <Section id="experience" title="Experience" className="bg-muted/30">
      <ol className="relative ml-2 space-y-8 border-s border-border ps-6">
        {entries.map((entry) => (
          <li key={entry.company} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -inset-s-7.5 top-2 size-3 rounded-full ring-4 ring-background",
                entry.current ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
            <Card>
              {entry.current && (
                <div
                  aria-hidden
                  className="-mt-(--card-spacing) h-1.5 w-full bg-linear-to-r from-primary to-brand-2"
                />
              )}
              <CardHeader>
                <CardTitle className="text-lg">{entry.role}</CardTitle>
                <CardDescription className="font-medium text-primary">
                  {entry.company}
                </CardDescription>
                <CardAction>
                  <Badge variant={entry.current ? "default" : "secondary"}>
                    {entry.dates}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div
                  className="markdown text-sm text-foreground/80"
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  )
}
