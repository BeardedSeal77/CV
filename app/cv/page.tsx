import type { Metadata } from "next"
import Image from "next/image"
import { Globe, Mail, MapPin, Phone } from "lucide-react"

import "./cv.css"
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
} from "@/lib/content"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    title: `${site.name} | CV`,
    robots: { index: false },
  }
}

// "https://github.com/BeardedSeal77" -> "github.com/BeardedSeal77"
function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[2.5mm] flex items-center gap-[2mm]">
      <span
        aria-hidden
        className="h-[4.5mm] w-[1.2mm] rounded-full bg-linear-to-b from-primary to-brand-2"
      />
      <h2 className="text-[11.5pt] font-bold tracking-tight">{children}</h2>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-[1.8mm] py-[0.3mm] text-[7.5pt] text-secondary-foreground">
      {children}
    </span>
  )
}

function Prose({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("cv-prose text-foreground/85", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function TagLine({ tags }: { tags: string[] }) {
  return (
    <p className="mt-[1mm] text-[7.5pt] text-muted-foreground">
      {tags.join(" · ")}
    </p>
  )
}

function Page({
  children,
  accent,
}: {
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <section className="cv-page flex flex-col">
      <div
        aria-hidden
        className={cn(
          "w-full shrink-0 bg-linear-to-r from-primary to-brand-2",
          accent ? "h-[2.5mm]" : "h-[1.2mm]"
        )}
      />
      <div className="flex min-h-0 flex-1 flex-col px-[13mm] pt-[9mm] pb-[10mm]">
        {children}
      </div>
    </section>
  )
}

export default async function CvPage() {
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

  // The "More on GitHub" card is a website teaser; the CV links GitHub instead
  const cvProjects = projects.filter((project) => !project.minis)

  const contacts = [
    { icon: Mail, text: site.email, href: `mailto:${site.email}` },
    site.phone && {
      icon: Phone,
      text: site.phone,
      href: `tel:${site.phone.replace(/\s/g, "")}`,
    },
    { icon: MapPin, text: site.location },
  ].filter(Boolean) as {
    icon: React.ComponentType<{ className?: string }>
    text: string
    href?: string
  }[]

  const links = [
    site.website && { icon: Globe, href: site.website },
    { icon: LinkedInIcon, href: site.linkedin },
    { icon: GitHubIcon, href: site.github },
  ].filter(Boolean) as {
    icon: React.ComponentType<{ className?: string }>
    href: string
  }[]

  return (
    <div className="cv">
      <Page accent>
        <header className="flex items-center gap-[6mm]">
          <Image
            src={site.headshot}
            alt={site.name}
            width={240}
            height={240}
            className="size-[27mm] shrink-0 rounded-full object-cover ring-[0.8mm] ring-primary/15"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[8pt] font-semibold tracking-[0.18em] text-primary uppercase">
              {site.title}
            </p>
            <h1 className="mt-[0.5mm] text-[23pt] leading-tight font-bold tracking-tight">
              {site.name}
            </h1>
            <p className="mt-[1mm] text-[10pt] text-muted-foreground">
              {site.tagline}
            </p>
          </div>
          <ul className="shrink-0 space-y-[1.2mm] text-[8pt]">
            {[...contacts, ...links.map((l) => ({ ...l, text: "" }))].map(
              ({ icon: Icon, text, href }) => {
                const label = text || displayUrl(href!)
                return (
                  <li key={label} className="flex items-center gap-[1.8mm]">
                    <Icon className="size-[3.3mm] shrink-0 text-primary" />
                    {href ? <a href={href}>{label}</a> : label}
                  </li>
                )
              }
            )}
          </ul>
        </header>

        <section className="mt-[5mm]">
          <Heading>Profile</Heading>
          <Prose html={about.html} />
        </section>

        <div className="mt-[5mm] grid min-h-0 flex-1 grid-cols-[1fr_54mm] gap-[7mm]">
          <section>
            <Heading>Experience</Heading>
            <div className="space-y-[3.4mm]">
              {experience.map((entry) => (
                <article key={entry.company}>
                  <div className="flex items-baseline justify-between gap-[3mm]">
                    <h3 className="text-[9.5pt] font-semibold">{entry.role}</h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-[1.8mm] py-[0.3mm] text-[7.5pt] font-medium",
                        entry.current
                          ? "bg-primary text-white"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {entry.dates}
                    </span>
                  </div>
                  <p className="text-[8.5pt] font-medium text-primary">
                    {entry.company}
                  </p>
                  <Prose html={entry.html} className="mt-[1mm]" />
                </article>
              ))}
            </div>
          </section>

          <aside>
            <Heading>Skills</Heading>
            <div className="space-y-[3mm]">
              {skills.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-[1.2mm] text-[8pt] font-semibold">
                    {group.title}
                  </h3>
                  <div className="flex flex-wrap gap-[1mm]">
                    {group.items.map((item) => (
                      <Chip key={item}>{item}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </Page>

      <Page>
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_54mm] gap-[7mm]">
          <section>
            <Heading>Projects</Heading>
            <div className="space-y-[4.5mm]">
              {cvProjects.map((project) => (
                <article key={project.title}>
                  <div className="flex items-baseline justify-between gap-[3mm]">
                    <h3 className="text-[10pt] font-semibold">
                      {project.title}
                    </h3>
                    {project.status && (
                      <span className="shrink-0 rounded-full bg-secondary px-[1.8mm] py-[0.3mm] text-[7.5pt] font-medium text-secondary-foreground">
                        {project.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[8pt] font-medium text-primary">
                    {project.subtitle}
                  </p>
                  <Prose html={project.html} className="mt-[1mm]" />
                  {project.features && (
                    <p className="mt-[1.2mm] text-foreground/85">
                      <span className="font-semibold text-foreground">
                        Features:{" "}
                      </span>
                      {project.features.join(" · ")}
                    </p>
                  )}
                  {project.impact && (
                    <p className="mt-[1.2mm] rounded-md bg-muted px-[2.5mm] py-[1.5mm] text-foreground/85">
                      <span className="font-semibold text-foreground">
                        Impact:{" "}
                      </span>
                      {project.impact}
                    </p>
                  )}
                  <TagLine tags={project.tags} />
                  {project.links && (
                    <p className="mt-[0.8mm] text-[7.5pt]">
                      {project.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-primary"
                        >
                          {displayUrl(link.href)}
                        </a>
                      ))}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-[6mm]">
            <section>
              <Heading>Education</Heading>
              <div className="space-y-[3mm]">
                {education.map((entry) => (
                  <article key={entry.degree}>
                    <h3 className="text-[8.75pt] leading-snug font-semibold">
                      {entry.degree}
                    </h3>
                    <p className="text-[8pt] font-medium text-primary">
                      {entry.institution}
                    </p>
                    {(entry.dates || entry.status) && (
                      <p className="text-[7.5pt] text-muted-foreground">
                        {[entry.dates, entry.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {entry.award && (
                      <p className="text-[7.5pt] text-muted-foreground">
                        Award: {entry.award}
                      </p>
                    )}
                    {entry.html && (
                      <Prose
                        html={entry.html}
                        className="mt-[0.8mm] text-[7.75pt]"
                      />
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section>
              <Heading>Certificates</Heading>
              <ul className="space-y-[1.5mm] text-[8pt]">
                {certifications.map((certification) => (
                  <li key={certification.title} className="flex gap-[2mm]">
                    <span className="w-[8mm] shrink-0 font-medium text-primary">
                      {certification.year}
                    </span>
                    <span>
                      {certification.title}
                      {certification.detail && `, ${certification.detail}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Heading>Qualities</Heading>
              <div className="flex flex-wrap gap-[1mm]">
                {about.qualities.map((quality) => (
                  <Chip key={quality}>{quality}</Chip>
                ))}
              </div>
            </section>

            <section>
              <Heading>Hobbies</Heading>
              <p className="text-[8pt]">
                {hobbies.map((hobby) => hobby.title).join(" · ")}
              </p>
            </section>

            <section>
              <Heading>References</Heading>
              <p className="text-[8pt]">Available on request</p>
            </section>
          </aside>
        </div>
      </Page>
    </div>
  )
}
