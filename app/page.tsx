import { About } from "@/components/site/about"
import { BentoHero } from "@/components/site/bento-hero"
import { Education } from "@/components/site/education"
import { Experience } from "@/components/site/experience"
import { Footer } from "@/components/site/footer"
import { Timeline } from "@/components/site/graphics"
import { Hobbies } from "@/components/site/hobbies"
import { Navbar, type NavSection } from "@/components/site/navbar"
import { Projects } from "@/components/site/projects"
import { Skills } from "@/components/site/skills"
import {
  getAbout,
  getCertifications,
  getEducation,
  getExperience,
  getHobbies,
  getProjects,
  getSite,
  getSkills,
  portfolioEnabled,
} from "@/lib/content"
import { withBasePath } from "@/lib/paths"

const NAV_SECTIONS: NavSection[] = [
  { id: "profile", label: "Profile" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "hobbies", label: "Hobbies" },
  { id: "contact", label: "Contact" },
]

export default async function Page() {
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

  const cvHref = withBasePath(site.cvPdf)
  const sections: NavSection[] = [
    ...NAV_SECTIONS,
    ...(portfolioEnabled(site)
      ? [
          {
            id: "portfolio",
            label: "Portfolio",
            href: withBasePath("/portfolio"),
          },
        ]
      : []),
    // The job hunt only exists on the local server; the public build never links it
    ...(process.env.CV_MODE === "local"
      ? [{ id: "jobs", label: "Job hunt", href: "/jobs" }]
      : []),
  ]

  return (
    <>
      <Navbar name={site.name} cvHref={cvHref} sections={sections} />
      <main>
        <BentoHero
          site={site}
          cvHref={cvHref}
          current={experience.find((entry) => entry.current)}
        />
        <About about={about} />
        <Experience
          entries={experience}
          timeline={
            <Timeline
              experience={experience}
              projects={projects}
              education={education}
            />
          }
        />
        <Projects
          projects={projects}
          portfolioHref={
            portfolioEnabled(site) ? withBasePath("/portfolio") : undefined
          }
        />
        <Skills groups={skills} />
        <Education entries={education} certifications={certifications} />
        <Hobbies hobbies={hobbies} />
      </main>
      <Footer site={site} cvHref={cvHref} />
    </>
  )
}
