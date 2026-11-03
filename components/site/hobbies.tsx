import { Section } from "@/components/site/section"
import { ZoomableImage } from "@/components/site/zoomable-image"
import type { Hobby } from "@/lib/content"
import { withBasePath } from "@/lib/paths"

// A small personal note, deliberately lighter than the work above it
export function Hobbies({ hobbies }: { hobbies: Hobby[] }) {
  return (
    <Section id="hobbies" title="Hobbies">
      <div className="mt-7 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {hobbies.map((hobby) => (
          <article key={hobby.title}>
            <ZoomableImage
              src={withBasePath(hobby.image)}
              alt={hobby.imageAlt}
              thumbClassName="aspect-[4/3] object-center"
            />
            <h3 className="mt-3 text-[15px] font-semibold">{hobby.title}</h3>
            <div
              className="markdown mt-1 text-[13.5px] text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: hobby.html }}
            />
          </article>
        ))}
      </div>
    </Section>
  )
}
