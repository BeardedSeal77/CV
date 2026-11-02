import Image from "next/image"
import { FileText, Mail, MapPin, Plane } from "lucide-react"

import { GitHubIcon, LinkedInIcon } from "@/components/site/icons"
import { RelocationParts } from "@/components/site/relocation"
import { Button } from "@/components/ui/button"
import type { SiteMeta } from "@/lib/content"
import { withBasePath } from "@/lib/paths"

interface HeroProps {
  site: SiteMeta
  cvHref: string
}

export function Hero({ site, cvHref }: HeroProps) {
  // overflow-x-clip (not hidden): stops the glows causing a horizontal
  // scrollbar while still letting them fade vertically into the next section
  return (
    <div id="top" className="relative overflow-x-clip">
      {/* Glow blobs as radial gradients: blur() gets clamped by the browser and cuts off in a hard edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] -z-10 size-136 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-[-12%] -z-10 size-104 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-brand-2)_14%,transparent),transparent_72%)]"
      />

      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-16 pb-14 md:grid-cols-[1fr_auto] md:pt-24 md:pb-20">
        <div>
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            {site.title}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight md:text-5xl">
            {site.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {site.tagline}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {site.location}
          </p>
          {site.relocation && (
            <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Plane className="mt-0.5 size-4 shrink-0" />
              <RelocationParts text={site.relocation} />
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button
              size="lg"
              nativeButton={false}
              render={<a href={cvHref} target="_blank" rel="noreferrer" />}
            >
              <FileText data-icon="inline-start" />
              View CV
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href={site.github} target="_blank" rel="noreferrer" />}
            >
              <GitHubIcon data-icon="inline-start" />
              GitHub
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a href={site.linkedin} target="_blank" rel="noreferrer" />
              }
            >
              <LinkedInIcon data-icon="inline-start" />
              LinkedIn
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<a href={`mailto:${site.email}`} />}
            >
              <Mail data-icon="inline-start" />
              Email
            </Button>
          </div>
        </div>

        <div className="relative mx-auto size-44 shrink-0 overflow-hidden rounded-full shadow-lg ring-4 ring-primary/25 md:size-56">
          <Image
            src={withBasePath(site.headshot)}
            alt={site.name}
            fill
            sizes="(min-width: 768px) 14rem, 11rem"
            className="object-cover object-top"
            priority
          />
        </div>
      </div>
    </div>
  )
}
