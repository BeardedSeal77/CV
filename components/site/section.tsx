import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

// Section name under a hard rule: sections read as clearly separate blocks
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
          className="border-t-2 border-foreground pt-3 pb-1 text-[15px] leading-snug font-semibold doc:pt-1.5 doc:pb-0.5"
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

export { MoreDetail } from "@/components/site/more-detail"
