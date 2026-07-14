import { About } from "@/components/site/about"
import { Education } from "@/components/site/education"
import { Experience } from "@/components/site/experience"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
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
} from "@/lib/content"
import { withBasePath } from "@/lib/paths"

const NAV_SECTIONS: NavSection[] = [
  { id: "about", label: "About" },
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

  return (
    <>
      <Navbar name={site.name} cvHref={cvHref} sections={NAV_SECTIONS} />
      <main>
        <Hero site={site} cvHref={cvHref} />
        <About about={about} />
        <Experience entries={experience} />
        <Projects projects={projects} />
        <Skills groups={skills} />
        <Education entries={education} certifications={certifications} />
        <Hobbies hobbies={hobbies} />
      </main>
      <Footer site={site} cvHref={cvHref} />
    </>
  )
}
