import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"
import { remark } from "remark"
import remarkHtml from "remark-html"

import { cvDir } from "./data-dir.mjs"

// Resolves inside the CV data folder only; the job hunt is never readable from here
function contentPath(relativePath: string) {
  const root = cvDir()
  const full = path.resolve(root, relativePath)
  if (!full.startsWith(root + path.sep)) {
    throw new Error(
      `Refusing to read outside the CV data folder: ${relativePath}`
    )
  }
  return full
}

// The kind of work something is; each has a colour pair in globals.css (--domain-*)
export const DOMAINS = [
  "ai",
  "automation",
  "backend",
  "frontend",
  "infra",
  "study",
] as const
export type Domain = (typeof DOMAINS)[number]

// Timeline dates: "2021" or "2021-06"; end "now" for ongoing
export interface Span {
  start?: string
  end?: string
}

export interface SiteMeta {
  name: string
  title: string
  tagline: string
  location: string
  relocation?: string
  email: string
  phone?: string
  website?: string
  github: string
  linkedin: string
  cvPdf: string
  // Set once the portfolio has content: enables /portfolio and its PDF
  portfolioPdf?: string
  headshot?: string
  contactBlurb: string
  // Page-level proof strip under the hero: measured numbers only
  proof?: Stat[]
  // The short stack shown in the website hero, logos and names
  stack?: string[]
  languages?: string[]
}

export interface Stat {
  value: string
  label: string
}

export interface Highlight {
  title: string
  text: string
}

export interface About {
  // Three-line profile shown first; the markdown body is the longer version
  summary?: string
  stats: Stat[]
  highlights: Highlight[]
  html: string
}

export interface Achievement {
  title: string
  detail?: string
  domain?: Domain
  // A lucide icon name, e.g. "Bot"
  icon?: string
}

export interface ExperienceEntry extends Span {
  company: string
  role: string
  dates: string
  current?: boolean
  // 2–4 outcome-first bullets, used instead of the body paragraph where present
  highlights?: string[]
  // Results as tiles; used instead of highlights where present
  achievements?: Achievement[]
  // One or two lines that replace the body paragraph in printed documents
  summary?: string
  tags: string[]
  html: string
}

export interface EducationEntry extends Span {
  degree: string
  institution: string
  dates?: string
  status?: string
  award?: string
  current?: boolean
  html: string
}

export interface CertificationItem {
  title: string
  detail?: string
  year: string
}

export interface ProjectLink {
  label: string
  href: string
}

export interface MiniProject {
  name: string
  text: string
}

export interface Capability {
  domain?: Domain
  icon?: string
  // Stage in a capability grid (Plan, Build…); capabilities without one show as chips
  group?: string
  title: string
  value?: string
  planned?: boolean
}

export interface Pitch {
  problem: string
  // One-line purpose per stage, by stage name, for the pipeline
  stages?: Record<string, string>
  capabilities?: Capability[]
  proof?: Stat[]
}

export interface ProjectMedia {
  src: string
  alt: string
}

export interface Project extends Span {
  domain?: Domain
  // Anchor and portfolio id: frontmatter `slug`, else the file name without its order prefix
  slug: string
  // Display order; without it projects keep their file-name order
  order?: number
  title: string
  subtitle: string
  featured?: boolean
  status?: string
  tags: string[]
  features?: string[]
  minis?: MiniProject[]
  links?: ProjectLink[]
  impact?: string
  pitch?: Pitch
  caseStudy?: string
  media?: ProjectMedia[]
  html: string
}

export interface SkillGroup {
  title: string
  items: string[]
  // Colour for the group's chips, with per-skill overrides
  domain?: Domain
  domains?: Record<string, Domain>
}

export interface Hobby {
  title: string
  image: string
  imageAlt: string
  html: string
}

async function toHtml(markdown: string): Promise<string> {
  if (!markdown.trim()) return ""
  const processed = await remark().use(remarkHtml).process(markdown)
  return processed.toString().trim()
}

function readFile(relativePath: string) {
  const raw = fs.readFileSync(contentPath(relativePath), "utf8")
  return matter(raw)
}

async function readCollection<T>(dir: string): Promise<T[]> {
  const dirPath = contentPath(dir)
  const files = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".md"))
    .sort()
  return Promise.all(
    files.map(async (file) => {
      const { data, content } = readFile(path.join(dir, file))
      return { ...data, html: await toHtml(content) } as T
    })
  )
}

export async function getSite(): Promise<SiteMeta> {
  return readFile("site.md").data as SiteMeta
}

// The portfolio is public once site.md names its PDF; locally it is always on, to work on
export function portfolioEnabled(site: SiteMeta) {
  return Boolean(site.portfolioPdf) || process.env.CV_MODE === "local"
}

// Projects with a pitch are the portfolio case studies; grid pitches lead
export function portfolioProjects(projects: Project[]) {
  const pitched = projects.filter((project) => project.pitch)
  const grid = (project: Project) =>
    project.pitch?.capabilities?.some((item) => item.group) ? 0 : 1
  return [...pitched].sort((a, b) => grid(a) - grid(b))
}

export async function getAbout(): Promise<About> {
  const { data, content } = readFile("about.md")
  return { ...data, html: await toHtml(content) } as About
}

export async function getExperience(): Promise<ExperienceEntry[]> {
  return readCollection<ExperienceEntry>("experience")
}

export async function getEducation(): Promise<EducationEntry[]> {
  return readCollection<EducationEntry>("education")
}

export async function getCertifications(): Promise<CertificationItem[]> {
  return readFile("certifications.md").data.items as CertificationItem[]
}

export async function getProjects(): Promise<Project[]> {
  const dir = "projects"
  const files = fs
    .readdirSync(contentPath(dir))
    .filter((file) => file.endsWith(".md"))
    .sort()
  const projects = await readCollection<Project>(dir)
  return projects
    .map((project, index) => ({
      ...project,
      slug:
        project.slug ?? path.basename(files[index], ".md").replace(/^\d+-/, ""),
    }))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

export async function getSkills(): Promise<SkillGroup[]> {
  return readFile("skills.md").data.groups as SkillGroup[]
}

export async function getHobbies(): Promise<Hobby[]> {
  return readCollection<Hobby>("hobbies")
}
