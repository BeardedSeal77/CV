import { Section } from "@/components/site/section"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SkillGroup } from "@/lib/content"
import { cn } from "@/lib/utils"

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <Section id="skills" title="Skills" className="bg-muted/30">
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group, index) => (
          <Card key={group.title}>
            {index === 0 && (
              <div
                aria-hidden
                className="-mt-(--card-spacing) h-1.5 w-full bg-linear-to-r from-primary to-brand-2"
              />
            )}
            <CardHeader>
              <CardTitle className={cn(index === 0 && "text-primary")}>
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  )
}
