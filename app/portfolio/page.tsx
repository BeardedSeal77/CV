import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { linkClass } from "@/components/site/hero"
import { Navbar, type NavSection } from "@/components/site/navbar"
import { PortfolioProjects } from "@/components/site/portfolio"
import {
  getProjects,
  getSite,
  portfolioEnabled,
  portfolioProjects,
} from "@/lib/content"
import { withBasePath } from "@/lib/paths"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    title: `${site.name} | Portfolio`,
    description: `${site.name}: case studies of the products I build.`,
  }
}

export default async function PortfolioPage() {
  const [site, projects] = await Promise.all([getSite(), getProjects()])
  if (!portfolioEnabled(site)) notFound()

  const studies = portfolioProjects(projects)
  const sections: NavSection[] = [
    { id: "cv", label: "CV", href: withBasePath("/") },
    ...studies.map((project) => ({ id: project.slug, label: project.title })),
  ]

  return (
    <>
      <Navbar
        name={site.name}
        cvHref={withBasePath(site.cvPdf)}
        sections={sections}
      />
      <main id="top" className="mx-auto max-w-page px-6 pt-12 pb-20 md:pt-18">
        <p className="font-mono text-[13px] tracking-[0.02em] text-muted-foreground">
          Portfolio · {site.name}
        </p>
        <h1 className="mt-3 text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-6xl">
          Case studies
        </h1>
        <p className="mt-4 max-w-[620px] text-lg leading-snug text-muted-foreground sm:text-[22px] sm:leading-[1.4]">
          The products I build, shown working: the problem, what each one does,
          and how it is put together.
        </p>
        {site.portfolioPdf && (
          <p className="mt-6 text-[15px]">
            <a
              href={withBasePath(site.portfolioPdf)}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Download the portfolio (PDF)
            </a>
          </p>
        )}

        <PortfolioProjects projects={studies} />
      </main>
    </>
  )
}
