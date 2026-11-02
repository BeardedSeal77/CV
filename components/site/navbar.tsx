"use client"

import * as React from "react"
import { Download, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { cn } from "@/lib/utils"

export interface NavSection {
  id: string
  label: string
  // A separate page rather than a section anchor
  href?: string
}

interface NavbarProps {
  name: string
  cvHref: string
  sections: NavSection[]
}

export function Navbar({ name, cvHref, sections }: NavbarProps) {
  const [activeId, setActiveId] = React.useState<string>("")
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      // Consider a section "active" while it crosses the upper-middle band of the viewport
      { rootMargin: "-25% 0px -65% 0px" }
    )
    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-2 px-6">
        <a href="#top" className="shrink-0 text-[15px] font-semibold">
          {name}
        </a>

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Sections"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={section.href ?? `#${section.id}`}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                activeId === section.id && "font-medium text-foreground"
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={cvHref} target="_blank" rel="noreferrer" />}
          >
            <Download data-icon="inline-start" />
            Download CV
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t px-6 py-2 md:hidden"
          aria-label="Sections"
          onClick={() => setMenuOpen(false)}
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={section.href ?? `#${section.id}`}
              className={cn(
                "block rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground",
                activeId === section.id && "font-medium text-foreground"
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
