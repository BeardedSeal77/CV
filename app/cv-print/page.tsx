import type { Metadata } from "next"
import { Globe, Mail, MapPin } from "lucide-react"

import "./cv-print.css"
import { GitHubIcon, LinkedInIcon } from "@/components/site/icons"
import {
  getAbout,
  getCertifications,
  getEducation,
  getExperience,
  getHobbies,
  getProjects,
  getSite,
  getSkills,
  type ExperienceEntry,
} from "@/lib/content"
import { withBasePath } from "@/lib/paths"

// Print-only route: rendered to public/ED_Cullen_CV.pdf by
// scripts/generate-cv-pdf.mjs. Not linked from the site nav.
export const metadata: Metadata = {
  title: "CV (print)",
  robots: { index: false, follow: false },
}

const WEBSITE_URL = "https://beardedseal77.github.io/CV/"

// How many roles stay on page 1. All four fit today; if content grows, lower
// this and the remainder flows into the top of page 2's left column.
const PAGE_1_EXPERIENCE = 4

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <article className="cvp-exp">
      <div className="cvp-exp-head">
        <span className="cvp-exp-company">{entry.company}</span>
        <span className="cvp-exp-dates">{entry.dates}</span>
      </div>
      <div className="cvp-exp-role">{entry.role}</div>
      <div
        className="cvp-prose"
        dangerouslySetInnerHTML={{ __html: entry.html }}
      />
      {entry.tags?.length ? (
        <ul className="cvp-chips">
          {entry.tags.map((tag) => (
            <li key={tag} className="cvp-chip">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export default async function CvPrintPage() {
  const [
    site,
    about,
    experience,
    projects,
    skills,
    education,
    certifications,
    hobbies,
  ] = await Promise.all([
    getSite(),
    getAbout(),
    getExperience(),
    getProjects(),
    getSkills(),
    getEducation(),
    getCertifications(),
    getHobbies(),
  ])

  const experiencePage1 = experience.slice(0, PAGE_1_EXPERIENCE)
  const experiencePage2 = experience.slice(PAGE_1_EXPERIENCE)

  return (
    <div className="cvp-root">
      {/* ---------------------------------------------------- Page 1 */}
      <section className="cvp-page cvp-page-1">
        <aside className="cvp-sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="cvp-shot"
            src={withBasePath(site.headshot)}
            alt={site.name}
            width={480}
            height={600}
          />

          <ul className="cvp-contact">
            <li>
              <Mail className="cvp-icon" aria-hidden />
              <span>{site.email}</span>
            </li>
            <li>
              <MapPin className="cvp-icon" aria-hidden />
              <span>{site.location}</span>
            </li>
            <li>
              <GitHubIcon className="cvp-icon" />
              <span>{stripProtocol(site.github)}</span>
            </li>
            <li>
              <LinkedInIcon className="cvp-icon" />
              <span>{stripProtocol(site.linkedin)}</span>
            </li>
          </ul>

          <div className="cvp-qualities">
            <h2 className="cvp-h cvp-h-light">Personal Qualities</h2>
            <ul className="cvp-bullets">
              {about.qualities.map((quality) => (
                <li key={quality}>{quality}</li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="cvp-main">
          <header className="cvp-namebar">
            <h1 className="cvp-name">{site.name}</h1>
            <p className="cvp-role-line">{site.title}</p>
          </header>

          <div className="cvp-main-body">
            <section className="cvp-section">
              <h2 className="cvp-h">About Me</h2>
              <div
                className="cvp-prose"
                dangerouslySetInnerHTML={{ __html: about.html }}
              />
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">Work Experience</h2>
              {experiencePage1.map((entry) => (
                <ExperienceItem key={entry.company} entry={entry} />
              ))}
            </section>
          </div>
        </main>
      </section>

      {/* ---------------------------------------------------- Page 2 */}
      <section className="cvp-page">
        <div className="cvp-band" />

        <div className="cvp-page-2-body">
          <div className="cvp-col">
            {experiencePage2.length ? (
              <section className="cvp-section">
                <h2 className="cvp-h">Work Experience (cont.)</h2>
                {experiencePage2.map((entry) => (
                  <ExperienceItem key={entry.company} entry={entry} />
                ))}
              </section>
            ) : null}

            <section className="cvp-section">
              <h2 className="cvp-h">Projects</h2>
              {projects.map((project) => (
                <article key={project.title} className="cvp-project">
                  <h3 className="cvp-project-title">{project.title}</h3>
                  <p className="cvp-project-subtitle">{project.subtitle}</p>
                  <div
                    className="cvp-prose"
                    dangerouslySetInnerHTML={{ __html: project.html }}
                  />
                  {project.featured && project.features?.length ? (
                    <ul className="cvp-features cvp-bullets">
                      {project.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}
                  {project.tags?.length ? (
                    <ul className="cvp-chips">
                      {project.tags.map((tag) => (
                        <li key={tag} className="cvp-chip">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">Education</h2>
              {education.map((entry) => (
                <div key={entry.degree} className="cvp-edu">
                  <div className="cvp-edu-degree">{entry.degree}</div>
                  <div className="cvp-edu-meta">
                    <span>{entry.institution}</span>
                  </div>
                  {entry.status || entry.award ? (
                    <div className="cvp-edu-note">
                      {entry.status ?? entry.award}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">References</h2>
              <p className="cvp-plain">Available on request</p>
            </section>
          </div>

          <div className="cvp-col">
            <section className="cvp-section">
              <h2 className="cvp-h">Technical Skills</h2>
              {skills.map((group) => (
                <div key={group.title} className="cvp-skill-group">
                  <h3 className="cvp-mini-h">{group.title}</h3>
                  <ul className="cvp-chips">
                    {group.items.map((item) => (
                      <li key={item} className="cvp-chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">Certificates</h2>
              {certifications.map((cert) => (
                <div key={cert.title} className="cvp-cert">
                  <ul className="cvp-list">
                    <li>
                      <span>{cert.title}</span>
                      <span className="cvp-cert-year">{cert.year}</span>
                    </li>
                  </ul>
                  {cert.detail ? (
                    <div className="cvp-cert-detail">{cert.detail}</div>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">Hobbies</h2>
              <ul className="cvp-bullets cvp-hobbies">
                {hobbies.map((hobby) => (
                  <li key={hobby.title}>{hobby.title}</li>
                ))}
              </ul>
            </section>

            <section className="cvp-section">
              <h2 className="cvp-h">Resources</h2>
              <div className="cvp-resource">
                <div className="cvp-resource-label">
                  <Globe className="cvp-icon" aria-hidden />
                  <span>Website</span>
                </div>
                <div className="cvp-resource-url">
                  {stripProtocol(WEBSITE_URL)}
                </div>
              </div>
              <div className="cvp-resource">
                <div className="cvp-resource-label">
                  <GitHubIcon className="cvp-icon" />
                  <span>GitHub</span>
                </div>
                <div className="cvp-resource-url">
                  {stripProtocol(site.github)}
                </div>
              </div>
              <div className="cvp-resource">
                <div className="cvp-resource-label">
                  <LinkedInIcon className="cvp-icon" />
                  <span>LinkedIn</span>
                </div>
                <div className="cvp-resource-url">
                  {stripProtocol(site.linkedin)}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
