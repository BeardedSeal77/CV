// The portfolio as flowing A4 pages: the same case studies as /portfolio, in the
// light print theme at document density. lib/pdf.mjs prints it.
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import "../../print.css"
import { displayUrl } from "@/components/site/hero"
import { PortfolioProjects } from "@/components/site/portfolio"
import {
  getProjects,
  getSite,
  portfolioEnabled,
  portfolioProjects,
} from "@/lib/content"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return { title: `${site.name} | Portfolio`, robots: { index: false } }
}

export default async function PortfolioPrintPage() {
  const [site, projects] = await Promise.all([getSite(), getProjects()])
  if (!portfolioEnabled(site)) notFound()

  const contact = [site.email, site.website && displayUrl(site.website)]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="print-doc print-stack">
      <div className="print-flow">
        <div className="doc-body">
          <header className="border-b pb-4">
            <p className="font-mono text-[13px] tracking-[0.02em] text-muted-foreground">
              Portfolio · {site.title}
            </p>
            <h1 className="mt-1.5 text-[44px] leading-[1.02] font-semibold tracking-[-0.03em]">
              {site.name}
            </h1>
            <p className="mt-2 font-mono text-[13px]">{contact}</p>
          </header>
          <PortfolioProjects projects={portfolioProjects(projects)} />
        </div>
      </div>
    </div>
  )
}
