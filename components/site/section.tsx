import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

// Section name over a hairline: it orients, the content is the headline
export function Section({ id, title, children, className }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-20 pt-16 doc:pt-5 doc:first:pt-0", className)}
    >
      <div className="mx-auto max-w-page px-6 doc:max-w-none doc:px-0">
        <h2
          id={`${id}-title`}
          className="border-b pb-3 text-[15px] leading-snug font-semibold doc:pb-1.5"
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

interface MetaRowProps {
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Dates (or a label) in a fixed left column, content on the right; stacks on phones
export function MetaRow({ meta, children, className }: MetaRowProps) {
  return (
    <div
      className={cn(
        "grid gap-x-12 gap-y-2 md:grid-cols-[11.25rem_minmax(0,1fr)] doc:grid-cols-[8.5rem_minmax(0,1fr)] doc:gap-x-6 doc:gap-y-1",
        className
      )}
    >
      <div className="font-mono text-[13px] tracking-[0.02em] text-muted-foreground">
        {meta}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function StackLine({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <p className="mt-3.5 font-mono text-[12.5px] text-muted-foreground doc:mt-1.5">
      {items.join(" · ")}
    </p>
  )
}

// Longer markdown behind a disclosure on the website; never printed
export function MoreDetail({
  html,
  label = "More detail",
}: {
  html: string
  label?: string
}) {
  if (!html) return null
  return (
    <details className="group mt-3 max-w-[720px] doc:hidden">
      <summary className="w-fit cursor-pointer list-none text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">Less</span>
      </summary>
      <div
        className="markdown mt-3 text-[15px] text-foreground/85"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  )
}
