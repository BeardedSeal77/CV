import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}

export function Section({ id, title, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-14 md:py-20", className)}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex items-center gap-3">
          <span
            aria-hidden
            className="h-7 w-1.5 rounded-full bg-linear-to-b from-primary to-brand-2"
          />
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  )
}
