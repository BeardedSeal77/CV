import { MoreDetail, Section } from "@/components/site/section"
import type { About as AboutContent } from "@/lib/content"

export function About({ about }: { about: AboutContent }) {
  return (
    <Section id="profile" title="Profile">
      <div className="mt-7 max-w-[720px] doc:mt-2 doc:max-w-none">
        {about.summary ? (
          <>
            <p className="text-lg leading-relaxed doc:text-base doc:leading-normal">
              {about.summary}
            </p>
            <MoreDetail html={about.html} label="More about me" />
          </>
        ) : (
          <div
            className="markdown text-[15px] text-foreground/85"
            dangerouslySetInnerHTML={{ __html: about.html }}
          />
        )}
      </div>
    </Section>
  )
}
