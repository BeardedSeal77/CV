// The printable cover letter page, styled like the CV sheet. The application
// PDF prints this page, then /cv, and merges the two.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import "@/app/cv/cv.css"
import { getSite } from "@/lib/content"
import { parseLetter, splitLetter } from "@/lib/jobhunt/letter"
import { getOpportunity, opportunityExists } from "@/lib/jobhunt/store"

export const metadata: Metadata = { title: "Cover letter", robots: { index: false } }

const LINK = "text-inherit no-underline"

function ContactLine({ line }: { line: string }) {
  const parts = line.split("·").map((p) => p.trim())
  return (
    <p className="mt-[1.5mm] text-[8.5pt] text-muted-foreground">
      {parts.map((part, i) => {
        let node: React.ReactNode = part
        if (/^[^@\s]+@[^@\s]+\.\w+$/.test(part)) node = <a className={LINK} href={`mailto:${part}`}>{part}</a>
        else if (/^\+?[\d\s]{7,}$/.test(part)) node = <a className={LINK} href={`tel:${part.replace(/\s/g, "")}`}>{part}</a>
        else if (/^(https?:\/\/)?[\w.-]+\.\w{2,}(\/\S*)?$/.test(part))
          node = <a className={LINK} href={part.startsWith("http") ? part : `https://${part}`}>{part}</a>
        return (
          <span key={i}>
            {i > 0 && <span className="mx-[1.6mm] text-primary">·</span>}
            {node}
          </span>
        )
      })}
    </p>
  )
}

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  if (!(await opportunityExists(id))) notFound()
  const [{ letter }, site] = await Promise.all([getOpportunity(id), getSite()])
  const parsed = parseLetter(splitLetter(letter).letter)

  return (
    <div className="cv" data-private="jobhunt">
      <section className="cv-page flex flex-col">
        <div aria-hidden className="h-[2.5mm] w-full shrink-0 bg-linear-to-r from-primary to-brand-2" />
        <div className="flex flex-col px-[20mm] pt-[13mm] pb-[14mm]">
          <header>
            <p className="text-[8pt] font-semibold tracking-[0.18em] text-primary uppercase">{site.title}</p>
            <h1 className="mt-[0.6mm] text-[23pt] leading-tight font-bold tracking-tight">
              {parsed.name ?? site.name}
            </h1>
            {parsed.contact && <ContactLine line={parsed.contact} />}
          </header>
          <hr className="my-[7mm] border-border" />
          {parsed.date && <p className="mb-[6mm] text-[9.5pt] text-muted-foreground">{parsed.date}</p>}
          <main className="text-[10.25pt] leading-[1.55] text-foreground/90">
            {parsed.paragraphs.map((lines, i) => (
              <p key={i} className="mb-[3.6mm]">
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
