import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"
import { remark } from "remark"
import remarkHtml from "remark-html"

const contentDir = path.join(process.cwd(), "content")

export interface SiteMeta {
  name: string
  title: string
  tagline: string
  location: string
  email: string
  github: string
  linkedin: string
  cvPdf: string
  headshot: string
  contactBlurb: string
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
  qualities: string[]
  stats: Stat[]
  highlights: Highlight[]
  html: string
}

export interface ExperienceEntry {
  company: string
  role: string
  dates: string
  current?: boolean
  tags: string[]
  html: string
}

export interface EducationEntry {
  degree: string
  institution: string
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
  const raw = fs.readFileSync(path.join(contentDir, relativePath), "utf8")
  return matter(raw)
}

async function readCollection<T>(dir: string): Promise<T[]> {
  const dirPath = path.join(contentDir, dir)
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
