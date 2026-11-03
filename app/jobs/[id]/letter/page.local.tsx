// The printable cover letter: a plain letter on one A4 sheet, in the same print
// theme and type as the CV. The backend's jobs.build_pdf prints it alone or in
// front of /cv.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import "@/app/print.css"
import { BackendError, callAction } from "@/lib/backend"
import { getSite } from "@/lib/content"
import { parseLetter } from "@/lib/jobhunt/letter"

import { Dot } from "../../_components/status"

export const metadata: Metadata = {
  title: "Cover letter",
  robots: { index: false },
}

const LINK = "text-inherit no-underline"
// Letters separate the parts of their contact line with a middle dot
const CONTACT_SEPARATOR = String.fromCharCode(0xb7)

function ContactLine({ line }: { line: string }) {
  const parts = line.split(CONTACT_SEPARATOR).map((p) => p.trim())
  return (
    <p className="mt-2 font-mono text-[12.5px] text-muted-foreground">
      {parts.map((part, i) => {
        let node: React.ReactNode = part
        if (/^[^@\s]+@[^@\s]+\.\w+$/.test(part))
          node = (
            <a className={LINK} href={`mailto:${part}`}>
              {part}
            </a>
          )
        else if (/^\+?[\d\s]{7,}$/.test(part))
          node = (
            <a className={LINK} href={`tel:${part.replace(/\s/g, "")}`}>
              {part}
            </a>
          )
        else if (/^(https?:\/\/)?[\w.-]+\.\w{2,}(\/\S*)?$/.test(part))
          node = (
            <a
              className={LINK}
              href={part.startsWith("http") ? part : `https://${part}`}
            >
              {part}
            </a>
          )
        return (
          <span key={i}>
            {i > 0 && <Dot className="mx-2" />}
            {node}
          </span>
        )
      })}
    </p>
  )
}

async function getLetter(id: string) {
  try {
    return await callAction<{ text: string; notes: string; date: string }>(
      "jobs.get_letter",
      { id }
    )
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound()
    throw err
  }
}

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params
  const [letter, site] = await Promise.all([getLetter(id), getSite()])
  const parsed = parseLetter(letter.text)

  return (
    <div className="print-doc print-stack" data-private="jobhunt">
      <section className="print-sheet">
        <div className="doc-body px-[6mm] pt-[4mm]">
          <header className="border-b pb-5">
            <p className="font-mono text-[13px] tracking-[0.02em] text-muted-foreground">
              {site.title}
            </p>
            <h1 className="mt-1.5 text-[34px] leading-tight font-semibold tracking-[-0.025em]">
              {parsed.name ?? site.name}
            </h1>
            {parsed.contact && <ContactLine line={parsed.contact} />}
          </header>
          {/* The day it renders (or the job's fixed date), never a stored one */}
          <p className="mt-7 mb-6 font-mono text-[13px] text-muted-foreground">
            {letter.date}
          </p>
          <main className="text-[17px] leading-[1.6]">
            {parsed.paragraphs.map((lines, i) => (
              <p key={i} className="mb-4">
                {lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            ))}
          </main>
        </div>
      </section>
    </div>
  )
}
