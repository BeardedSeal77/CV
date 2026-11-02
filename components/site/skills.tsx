import { Section } from "@/components/site/section"
import type { SkillGroup } from "@/lib/content"
import { cn } from "@/lib/utils"

const isWorkingStyle = (group: SkillGroup) => /working style/i.test(group.title)

// Groups as plain rows; trait words always come last
export function Skills({ groups }: { groups: SkillGroup[] }) {
  const ordered = [
    ...groups.filter((group) => !isWorkingStyle(group)),
    ...groups.filter(isWorkingStyle),
  ]

  return (
    <Section id="skills" title="Skills">
      <dl className="mt-4 doc:mt-1">
        {ordered.map((group) => (
          <div
            key={group.title}
            className={cn(
              "grid gap-x-12 gap-y-1 border-b py-3 text-[15px] md:grid-cols-[11.25rem_minmax(0,1fr)] doc:grid-cols-[8.5rem_minmax(0,1fr)] doc:gap-x-6 doc:py-1",
              isWorkingStyle(group) && "text-muted-foreground"
            )}
          >
            <dt className="font-semibold">{group.title}</dt>
            <dd className="max-w-[720px]">{group.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
