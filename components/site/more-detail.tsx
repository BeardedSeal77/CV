"use client"

import { ChevronDown } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// Longer markdown behind an outlined toggle on the website; never printed
export function MoreDetail({
  html,
  label = "More detail",
}: {
  html: string
  label?: string
}) {
  if (!html) return null
  return (
    <Collapsible className="mt-4 max-w-[720px] doc:hidden">
      <CollapsibleTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "group/more gap-1.5 text-muted-foreground hover:text-foreground data-[panel-open]:text-foreground"
        )}
      >
        {label}
        <ChevronDown
          aria-hidden
          className="transition-transform group-data-[panel-open]/more:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className="markdown mt-3 rounded-lg border bg-card p-4 text-[15px] text-foreground/85"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
