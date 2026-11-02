// MCP server for the job hunt and the CV data. Local mode only: served over
// Streamable HTTP at /mcp by `npm run local`, or over stdio by `npm run mcp:stdio`.
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { splitLetter, joinLetter } from "../lib/jobhunt/letter"
import { buildApplicationPdf, parsePdfOptions } from "../lib/jobhunt/pdf"
import { STATUSES, ListingPatchSchema, StatusSchema } from "../lib/jobhunt/schema"
import { jobStats } from "../lib/jobhunt/stats"
import {
  addOpportunity,
  getOpportunity,
  listOpportunities,
  logEvent,
  setDoc,
  updateListing,
} from "../lib/jobhunt/store"
import { listSections, readSection, writeSection } from "./cv-sections"

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
})
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })

export interface McpOptions {
  /** Origin of the local Next server, used to print application PDFs */
  baseUrl: string
}

export function createMcpServer({ baseUrl }: McpOptions) {
  const server = new McpServer({ name: "cv-platform", version: "1.0.0" })

  server.registerTool(
    "jobs_list",
    {
      description:
        "List job opportunities, optionally filtered by status, country code, company or free text.",
      inputSchema: {
        status: StatusSchema.optional(),
        country: z.string().optional().describe("ISO country code, e.g. LV, LT, PL"),
        company: z.string().optional(),
        text: z.string().optional().describe("Matches company, role or city"),
      },
    },
    async ({ status, country, company, text: q }) => {
      const needle = q?.toLowerCase()
      const opps = (await listOpportunities()).filter(
        (o) =>
          (!status || o.application.status === status) &&
          (!country || o.country.toLowerCase() === country.toLowerCase()) &&
          (!company || o.company.toLowerCase().includes(company.toLowerCase())) &&
          (!needle || `${o.company} ${o.role} ${o.city}`.toLowerCase().includes(needle))
      )
      return json(
        opps.map((o) => ({
          id: o.id,
          company: o.company,
          role: o.role,
          country: o.country,
          city: o.city,
          status: o.application.status,
          updated: o.application.updated,
        }))
      )
    }
  )

  server.registerTool(
    "jobs_get",
    {
      description: "One opportunity with its timeline, job description, cover letter and prep notes.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => json(await getOpportunity(id))
  )

  server.registerTool(
    "jobs_add",
    {
      description: "Create an opportunity with status Shortlisted. Returns the new record and its id.",
      inputSchema: {
        company: z.string(),
        role: z.string(),
        country: z.string().optional(),
        city: z.string().optional(),
        platform: z.string().optional(),
        url: z.string().optional(),
        email: z.string().optional(),
        pay: z.string().optional(),
        mode: z.string().optional(),
        fit: z.string().optional().describe("Strong, Good or Stretch"),
        posted: z.string().optional().describe("YYYY-MM-DD"),
        deadline: z.string().optional().describe("YYYY-MM-DD"),
        size: z.string().optional(),
        what: z.string().optional().describe("One line on what the company does"),
        jd: z.string().optional().describe("Job description, full or summary"),
      },
    },
    async (input) => json(await addOpportunity(input))
  )

  server.registerTool(
    "jobs_update",
    {
      description: "Change listing fields of an opportunity (not its status: use jobs_log_event).",
      inputSchema: { id: z.string(), fields: ListingPatchSchema },
    },
    async ({ id, fields }) => json(await updateListing(id, fields))
  )

  server.registerTool(
    "jobs_log_event",
    {
      description: `Append a dated event to an opportunity's timeline, optionally changing its status (${STATUSES.join(", ")}).`,
      inputSchema: {
        id: z.string(),
        date: z.string().optional().describe("YYYY-MM-DD, defaults to today"),
        status: StatusSchema.optional(),
        note: z.string().optional(),
        link: z.string().optional().describe("e.g. the email thread"),
      },
    },
    async ({ id, ...event }) => json(await logEvent(id, event))
  )

  server.registerTool(
    "jobs_get_letter",
    {
      description: "Read a cover letter: private prep notes and the letter text, separately.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => json(splitLetter((await getOpportunity(id)).letter))
  )

  server.registerTool(
    "jobs_set_letter",
    {
      description:
        "Replace a cover letter. `letter` is the printed text (header, date, salutation, body, sign-off). `notes` replaces the private prep notes; omit it to keep them.",
      inputSchema: { id: z.string(), letter: z.string(), notes: z.string().optional() },
    },
    async ({ id, letter, notes }) => {
      const current = splitLetter((await getOpportunity(id)).letter)
      await setDoc(id, "letter", joinLetter({ notes: notes ?? current.notes, letter }))
      return text(`Saved the cover letter for ${id}.`)
    }
  )

  server.registerTool(
    "jobs_build_pdf",
    {
      description:
        "Render a PDF into jobhunt/output. kind \"application\" (default) is the CV, with the cover letter in front unless coverLetter is false and the portfolio behind if portfolio is true; kind \"letter\" is the cover letter alone. Needs the local server running.",
      inputSchema: {
        id: z.string(),
        kind: z.enum(["application", "letter"]).optional(),
        coverLetter: z.boolean().optional(),
        portfolio: z.boolean().optional(),
      },
    },
    async ({ id, ...options }) =>
      json(await buildApplicationPdf(id, baseUrl, parsePdfOptions(options)))
  )

  server.registerTool(
    "jobs_stats",
    { description: "Summary numbers: applied, active, rejected, heard-back rate, letters ready, companies." },
    async () => json(jobStats(await listOpportunities()))
  )

  server.registerTool(
    "cv_get_section",
    {
      description:
        "Read a CV section as markdown with frontmatter, e.g. site, about, skills, experience/01-acme. Omit name to list sections.",
      inputSchema: { name: z.string().optional() },
    },
    async ({ name }) => (name ? text(await readSection(name)) : json(await listSections()))
  )

  server.registerTool(
    "cv_update_section",
    {
      description:
        "Replace a CV section's markdown (frontmatter must stay valid YAML). Changes the local data only; publishing still needs a push of the data repo.",
      inputSchema: { name: z.string(), content: z.string() },
    },
    async ({ name, content }) => {
      await writeSection(name, content)
      return text(`Updated ${name}. Push the data repo to publish it.`)
    }
  )

  server.registerResource(
    "cv-site",
    "cv://site",
    { description: "The CV's site settings: name, headline, contacts", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, text: await readSection("site") }] })
  )

  server.registerResource(
    "cv-section",
    new ResourceTemplate("cv://section/{name}", {
      list: async () => ({
        resources: (await listSections()).map((n) => ({ uri: `cv://section/${n}`, name: n })),
      }),
    }),
    { description: "A CV section as markdown", mimeType: "text/markdown" },
    async (uri, { name }) => ({
      contents: [{ uri: uri.href, text: await readSection(decodeURIComponent(String(name))) }],
    })
  )

  server.registerResource(
    "job-opportunity",
    new ResourceTemplate("jobs://opportunity/{id}", {
      list: async () => ({
        resources: (await listOpportunities()).map((o) => ({
          uri: `jobs://opportunity/${o.id}`,
          name: `${o.company}: ${o.role}`,
        })),
      }),
    }),
    { description: "One opportunity with timeline and documents", mimeType: "application/json" },
    async (uri, { id }) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(await getOpportunity(String(id)), null, 2) }],
    })
  )

  return server
}
