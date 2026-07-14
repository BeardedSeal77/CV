import { Download } from "lucide-react"

import { GitHubIcon, LinkedInIcon } from "@/components/site/icons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SiteMeta } from "@/lib/content"

interface FooterProps {
  site: SiteMeta
  cvHref: string
}

export function Footer({ site, cvHref }: FooterProps) {
  return (
    <footer id="contact" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-5xl px-4 py-14 text-center md:py-20">
        <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          Get in touch
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {site.contactBlurb}
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-4 inline-block text-lg font-medium text-primary hover:underline"
        >
          {site.email}
        </a>

        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={site.github} target="_blank" rel="noreferrer" />}
          >
            <GitHubIcon data-icon="inline-start" />
            GitHub
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={site.linkedin} target="_blank" rel="noreferrer" />}
          >
            <LinkedInIcon data-icon="inline-start" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={cvHref} target="_blank" rel="noreferrer" />}
          >
            <Download data-icon="inline-start" />
            CV
          </Button>
        </div>

        <Separator className="mx-auto mt-10 max-w-xs" />
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {site.name} · {site.location} · Built
          with Next.js & shadcn/ui
        </p>
      </div>
    </footer>
  )
}
