import { linkClass } from "@/components/site/hero"
import { Section } from "@/components/site/section"
import { Button } from "@/components/ui/button"
import type { SiteMeta } from "@/lib/content"

interface FooterProps {
  site: SiteMeta
  cvHref: string
}

export function Footer({ site, cvHref }: FooterProps) {
  return (
    <>
      <Section id="contact" title="Contact">
        <div className="mt-7 max-w-[720px]">
          <p className="text-lg leading-relaxed">{site.contactBlurb}</p>
          <a
            href={`mailto:${site.email}`}
            className="mt-4 inline-block text-2xl font-semibold tracking-[-0.02em] break-all underline decoration-border underline-offset-[6px] transition-colors hover:decoration-primary md:text-3xl"
          >
            {site.email}
          </a>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
            <Button
              className="h-11 rounded-md px-5 text-[15px]"
              nativeButton={false}
              render={<a href={cvHref} target="_blank" rel="noreferrer" />}
            >
              Download CV (PDF)
            </Button>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              GitHub
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </Section>

      <footer className="mx-auto max-w-page px-6 pt-16 pb-10">
        <div className="flex flex-wrap justify-between gap-3 border-t pt-5 font-mono text-[13px] text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {site.name} · {site.location}
          </span>
          <span>Built with Next.js and shadcn/ui</span>
        </div>
      </footer>
    </>
  )
}
