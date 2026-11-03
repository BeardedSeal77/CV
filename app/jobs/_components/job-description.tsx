"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** The job description, in English when a translation is stored */
export function JobDescription({
  original,
  english,
}: {
  original: string
  english: string
}) {
  const [showEnglish, setShowEnglish] = useState(true)
  const text = english && showEnglish ? english : original
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Job description</CardTitle>
        {english && original && (
          <CardAction className="flex gap-1">
            <Button
              size="sm"
              variant={showEnglish ? "secondary" : "ghost"}
              onClick={() => setShowEnglish(true)}
            >
              English
            </Button>
            <Button
              size="sm"
              variant={showEnglish ? "ghost" : "secondary"}
              onClick={() => setShowEnglish(false)}
            >
              Original
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {text ? (
          <div className="max-h-72 overflow-y-auto text-[13.5px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {text}
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground">
            No description saved.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
