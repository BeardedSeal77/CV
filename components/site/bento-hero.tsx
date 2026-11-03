import Image from "next/image"
import { Plane } from "lucide-react"

import { TechStrip } from "@/components/site/graphics"
import { linkClass } from "@/components/site/hero"
import { Button } from "@/components/ui/button"
import type { ExperienceEntry, SiteMeta } from "@/lib/content"
import { withBasePath } from "@/lib/paths"
import { cn } from "@/lib/utils"

const card = "min-w-0 rounded-lg border bg-card p-5"
const label = "font-mono text-[12.5px] tracking-[0.02em] text-muted-foreground"

interface BentoHeroProps {
  site: SiteMeta
  cvHref: string
  current?: ExperienceEntry
}

// Website hero as fact cards: who, now, where, proof, stack. The PDF keeps <Hero>.
export function BentoHero({ site, cvHref, current }: BentoHeroProps) {
  const proof = site.proof ?? []
  // "Relocating to the EU · Blue Card … · notice": the first part is the headline
  const [move, ...details] = site.relocation?.split(" · ") ?? []
  return (
    <div id="top" className="mx-auto max-w-page px-6 pt-8 md:pt-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section
          aria-label="Introduction"
          className={cn(
            card,
            "flex flex-col justify-between gap-8 sm:col-span-2 md:p-7 lg:row-span-2"
          )}
        >
          <div>
            <p className={label}>
              {site.title} · {site.location}
            </p>
            <h1 className="mt-2 text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px]">
              {site.name}
            </h1>
            <p className="mt-3 max-w-[560px] text-lg leading-snug text-muted-foreground sm:text-xl">
              {site.tagline}
            </p>
            {move && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-[15px] font-semibold text-primary-foreground">
                <Plane aria-hidden className="size-4" />
                {move}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[15px]">
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
              Email
            </a>
          </div>
        </section>

        {current && (
          <section aria-label="Current role" className={card}>
            <p className={label}>Now</p>
            <p className="mt-2 text-[17px] leading-snug font-semibold">
              {current.role}
            </p>
            <p className="text-[13.5px] text-muted-foreground">
              {current.company}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[12px] text-primary">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Since {current.dates.replace(/\s*–\s*Present$/i, "")}
            </p>
          </section>
        )}

        {site.headshot && (
          <div className="relative hidden min-h-56 overflow-hidden rounded-lg border lg:row-span-2 lg:block">
            <Image
              src={withBasePath(site.headshot)}
              alt={site.name}
              fill
              sizes="16rem"
              className="object-cover object-top"
              priority
            />
          </div>
        )}

        {/* Where: the move to Europe leads, highlighted in the brand tint */}
        <section
          aria-label="Location"
          className={cn(card, move && "border-primary/40 bg-primary-soft")}
        >
          <p className={label}>Where</p>
          <p className="mt-2 text-[17px] leading-snug font-semibold">
            {move ?? site.location}
          </p>
          <ul className="mt-1 space-y-0.5 text-[13.5px] leading-snug text-muted-foreground">
            {move && <li>From {site.location}</li>}
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </section>

        {proof.map((item, index) => (
          <section key={item.label} aria-label={item.label} className={card}>
            <p
              className={cn(
                "font-mono text-[34px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[40px]",
                index === 0 && "text-primary"
              )}
            >
              {item.value}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
              {item.label}
            </p>
          </section>
        ))}

        {site.stack?.length ? (
          <section
            aria-label="Stack"
            className={cn(card, "sm:col-span-2 lg:col-span-4")}
          >
            <p className={label}>Stack</p>
            <TechStrip
              items={site.stack}
              className="mt-3 gap-x-5 text-[14px] text-foreground"
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}
