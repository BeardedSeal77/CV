import Image from "next/image"

import { ProofStrip } from "@/components/site/proof-strip"
import { RelocationParts } from "@/components/site/relocation"
import { Button } from "@/components/ui/button"
import type { SiteMeta } from "@/lib/content"
import { withBasePath } from "@/lib/paths"

interface HeroProps {
  site: SiteMeta
  cvHref: string
}

export const linkClass =
  "font-medium underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"

// "https://github.com/example" -> "github.com/example"
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
}

// Printed documents spell every contact out as text, so ATS parsers and copy-paste get them
function ContactLine({ site }: { site: SiteMeta }) {
  const items = [
    { label: site.email, href: `mailto:${site.email}` },
    site.phone && {
      label: site.phone,
      href: `tel:${site.phone.replace(/\s/g, "")}`,
    },
    site.website && { label: displayUrl(site.website), href: site.website },
    { label: displayUrl(site.linkedin), href: site.linkedin },
    { label: displayUrl(site.github), href: site.github },
  ].filter((item): item is { label: string; href: string } => Boolean(item))

  return (
    <p className="mt-4 hidden flex-wrap gap-x-2 font-mono text-[13px] doc:flex">
      {items.map((item, index) => (
        <span key={item.href}>
          {index > 0 && (
            <span aria-hidden className="mr-2 text-muted-foreground">
              ·
            </span>
          )}
          <a href={item.href} className="text-inherit no-underline">
            {item.label}
          </a>
        </span>
      ))}
    </p>
  )
}

export function Hero({ site, cvHref }: HeroProps) {
  return (
    <div id="top" className="mx-auto max-w-page px-6 doc:max-w-none doc:px-0">
      <div className="flex flex-col-reverse gap-6 pt-10 pb-10 md:flex-row md:items-end md:justify-between md:gap-12 md:pt-18 md:pb-12 doc:flex-row doc:items-center doc:gap-8 doc:pt-0 doc:pb-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[13px] tracking-[0.02em] text-muted-foreground">
            {site.title} · {site.location}
          </p>
          <h1 className="mt-3 text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-6xl doc:mt-1.5 doc:text-[44px]">
            {site.name}
          </h1>
          <p className="mt-4 max-w-[620px] text-lg leading-snug text-muted-foreground sm:text-[22px] sm:leading-[1.4] doc:mt-2 doc:text-[19px]">
            {site.tagline}
          </p>
          {site.relocation && (
            <p className="mt-6 inline-flex items-start gap-2 rounded-md border bg-card px-3 py-2 font-mono text-[13px] leading-relaxed doc:mt-3 doc:py-1">
              <span
                aria-hidden
                className="mt-[0.45rem] size-2 shrink-0 rounded-full bg-primary"
              />
              <RelocationParts text={site.relocation} />
            </p>
          )}
          <ContactLine site={site} />

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] doc:hidden">
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
            <a href={`mailto:${site.email}`} className={linkClass}>
              {site.email}
            </a>
          </div>
        </div>

        {site.headshot && (
          <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border md:size-44 doc:size-32">
            <Image
              src={withBasePath(site.headshot)}
              alt={site.name}
              fill
              sizes="(min-width: 768px) 11rem, 7rem"
              className="object-cover object-top"
              priority
            />
          </div>
        )}
      </div>

      {site.proof && <ProofStrip items={site.proof} />}
    </div>
  )
}
