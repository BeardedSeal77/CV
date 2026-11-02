// The two-page CV: the website's own section components on fixed A4 sheets,
// in the light print theme and at document density. lib/pdf.mjs prints it.
import type { Metadata } from "next"

import "../print.css"
import { About } from "@/components/site/about"
import { Education } from "@/components/site/education"
import { Experience } from "@/components/site/experience"
import { displayUrl, Hero } from "@/components/site/hero"
import { Projects } from "@/components/site/projects"
import { Skills } from "@/components/site/skills"
import {
  getAbout,
  getCertifications,
  getEducation,
  getExperience,
  getProjects,
  getSite,
  getSkills,
} from "@/lib/content"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    title: `${site.name} | CV`,
    robots: { index: false },
  }
}

export default async function CvPage() {
  const [site, about, experience, projects, skills, education, certifications] =
    await Promise.all([
      getSite(),
      getAbout(),
      getExperience(),
      getProjects(),
      getSkills(),
      getEducation(),
      getCertifications(),
    ])

  // Only pitched projects make the two pages (a role's own project prints under
  // that role); the rest live on the website
  const linked = new Set(experience.map((entry) => entry.project))
  const cvProjects = projects.filter(
    (project) => project.pitch && !linked.has(project.slug)
  )
  const more = site.website
    ? `${displayUrl(site.website)}${site.portfolioPdf ? "/portfolio" : ""}`
    : undefined

  return (
    <div className="print-doc print-stack">
      <section className="print-sheet">
        <div className="doc-body">
          <Hero site={site} cvHref={site.cvPdf} />
          <About about={about} />
          <Experience entries={experience} projects={projects} />
        </div>
      </section>

      <section className="print-sheet">
        <div className="doc-body">
          {cvProjects.length > 0 && <Projects projects={cvProjects} />}
          <Skills groups={skills} />
          <Education entries={education} certifications={certifications} />
          {more || site.languages?.length ? (
            <p className="mt-5 border-t pt-2.5 font-mono text-[13px] text-muted-foreground">
              {site.languages?.length ? (
                <span>Languages: {site.languages.join(", ")}</span>
              ) : null}
              {site.languages?.length && more ? <span> · </span> : null}
              {more && (
                <span>
                  More projects, screenshots and demos:{" "}
                  <a
                    href={site.website}
                    className="text-foreground no-underline"
                  >
                    {more}
                  </a>
                </span>
              )}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
