"use client"

import Image from "next/image"
import { Maximize2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// A screenshot that opens full size in a shadcn Dialog when clicked
export function ZoomableImage({
  src,
  alt,
  className,
  thumbClassName = "aspect-video",
}: {
  src: string
  alt: string
  className?: string
  // Shape of the thumbnail; the dialog always shows the whole image
  thumbClassName?: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={`Enlarge: ${alt}`}
        className={cn(
          "group/zoom relative block w-full cursor-zoom-in overflow-hidden rounded-lg border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className
        )}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1000}
          className={cn(
            "w-full object-cover object-top transition-transform duration-200 group-hover/zoom:scale-[1.01]",
            thumbClassName
          )}
        />
        <span
          aria-hidden
          className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-md border bg-background/90 text-foreground opacity-0 transition-opacity group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100 doc:hidden"
        >
          <Maximize2 className="size-4" />
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-[min(96vw,1600px)] gap-2 p-2 sm:max-w-[min(96vw,1600px)]">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1200}
          className="h-auto max-h-[86vh] w-full rounded-md object-contain"
        />
        <p className="px-1 pb-1 text-[13.5px] text-muted-foreground">{alt}</p>
      </DialogContent>
    </Dialog>
  )
}
