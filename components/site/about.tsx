import { Section } from "@/components/site/section"
import { Badge } from "@/components/ui/badge"
import type { About as AboutContent } from "@/lib/content"

export function About({ about }: { about: AboutContent }) {
  return (
    <Section id="about" title="About Me">
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div>
          <div
            className="markdown text-foreground/80"
            dangerouslySetInnerHTML={{ __html: about.html }}
          />
          <div className="mt-6 flex flex-wrap gap-1.5">
            {about.qualities.map((quality) => (
              <Badge key={quality} variant="secondary">
                {quality}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Highlights
          </h3>
          <ul className="mt-4 space-y-3">
            {about.highlights.map((highlight) => (
              <li key={highlight.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                />
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">{highlight.title}:</span>{" "}
                  <span className="text-muted-foreground">
                    {highlight.text}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {about.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-card p-4 text-center ring-1 ring-foreground/10"
          >
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
