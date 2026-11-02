// Read and edit the CV's markdown sections (data/cv/**/*.md) for the MCP tools.
import fs from "node:fs/promises"
import path from "node:path"

import matter from "gray-matter"

import { cvDir } from "../lib/data-dir.mjs"

function sectionPath(name: string) {
  const root = cvDir()
  const clean = name.replace(/\\/g, "/").replace(/\.md$/, "")
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(clean) || clean.includes("..")) {
    throw new Error(`Invalid section name: ${name}`)
  }
  const file = path.resolve(root, `${clean}.md`)
  if (!file.startsWith(root + path.sep)) throw new Error(`Invalid section name: ${name}`)
  return file
}

/** Section names relative to data/cv, e.g. "site", "experience/01-acme" */
export async function listSections(): Promise<string[]> {
  const root = cvDir()
  const out: string[] = []
  async function walk(dir: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== "media") await walk(full)
      else if (entry.name.endsWith(".md")) {
        out.push(path.relative(root, full).replace(/\\/g, "/").replace(/\.md$/, ""))
      }
    }
  }
  await walk(root)
  return out.sort()
}

export async function readSection(name: string) {
  return fs.readFile(sectionPath(name), "utf8")
}

/** Replaces a section after checking its frontmatter still parses */
export async function writeSection(name: string, content: string) {
  matter(content) // throws on malformed YAML frontmatter
  const file = sectionPath(name)
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await fs.writeFile(tmp, content.replace(/\r\n/g, "\n").trimEnd() + "\n", "utf8")
  await fs.rename(tmp, file)
}
