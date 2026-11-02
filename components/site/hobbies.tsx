import Image from "next/image"

import { Section } from "@/components/site/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Hobby } from "@/lib/content"
import { withBasePath } from "@/lib/paths"

export function Hobbies({ hobbies }: { hobbies: Hobby[] }) {
  return (
    <Section id="hobbies" title="Hobbies & Interests" className="bg-muted/30">
      <div className="grid gap-6 md:grid-cols-3">
        {hobbies.map((hobby) => (
          <Card key={hobby.title}>
            <Image
              src={withBasePath(hobby.image)}
              alt={hobby.imageAlt}
              width={800}
              height={600}
              className="h-44 w-full object-cover"
            />
            <CardHeader>
              <CardTitle>{hobby.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="markdown text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: hobby.html }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
