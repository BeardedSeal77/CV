import type { Stat } from "@/lib/content"
import { cn } from "@/lib/utils"

interface ProofStripProps {
  items: Stat[]
  // "page" sits under the hero between two rules; "inline" closes a pitch block
  variant?: "page" | "inline"
  className?: string
}

// Measured figures only; the lead figure carries the accent
export function ProofStrip({
  items,
  variant = "page",
  className,
}: ProofStripProps) {
  if (items.length === 0) return null
  const page = variant === "page"

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-8 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] doc:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]",
        page ? "border-y" : "mt-6 gap-y-4 border-t pt-5 doc:mt-3 doc:pt-2.5",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn("flex flex-col-reverse", page && "py-6 doc:py-2.5")}
        >
          <dt className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground doc:mt-0.5">
            {item.label}
          </dt>
          <dd
            className={cn(
              "font-mono leading-[1.1] font-medium tracking-[-0.02em]",
              page
                ? "text-[32px] md:text-[40px] doc:text-[30px]"
                : "text-[26px] doc:text-[22px]",
              index === 0 && "text-primary"
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
