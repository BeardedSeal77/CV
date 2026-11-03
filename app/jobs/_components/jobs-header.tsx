import Link from "next/link"

/** Shared header for the local-only job hunt pages */
export function JobsHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div>
        <nav className="flex gap-3 text-sm text-muted-foreground">
          <Link href="/jobs" className="hover:text-foreground">
            Job hunt
          </Link>
          <Link href="/jobs/companies" className="hover:text-foreground">
            Companies
          </Link>
          <Link href="/" className="hover:text-foreground">
            CV site
          </Link>
        </nav>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  )
}
