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
    throw new Error(`Refusing to read outside the CV data folder: ${relativePath}`)
  }
  return full
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
  headshot?: string
  contactBlurb: string
  // Page-level proof strip under the hero: measured numbers only
  proof?: Stat[]
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

export interface ExperienceEntry {
  company: string
  role: string
  dates: string
  current?: boolean
  // 2–4 outcome-first bullets, used instead of the body paragraph where present
  highlights?: string[]
  tags: string[]
  html: string
}

export interface EducationEntry {
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
  // Stage in a capability grid (Plan, Build…); capabilities without one show as chips
  group?: string
  title: string
  value?: string
  planned?: boolean
}

export interface Pitch {
  problem: string
  capabilities?: Capability[]
  proof?: Stat[]
}

export interface ProjectMedia {
  src: string
  alt: string
}

export interface Project {
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
  return readCollection<Project>("projects")
}

export async function getSkills(): Promise<SkillGroup[]> {
  return readFile("skills.md").data.groups as SkillGroup[]
}

export async function getHobbies(): Promise<Hobby[]> {
  return readCollection<Hobby>("hobbies")
}
