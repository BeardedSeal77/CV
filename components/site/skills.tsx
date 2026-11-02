import { DomainChip, DomainLegend } from "@/components/site/graphics"
import { Section } from "@/components/site/section"
import { type Domain, DOMAINS, type SkillGroup } from "@/lib/content"
import { cn } from "@/lib/utils"

const isWorkingStyle = (group: SkillGroup) => /working style/i.test(group.title)

const domainOf = (group: SkillGroup, item: string): Domain | undefined =>
  group.domains?.[item] ?? group.domain

// Groups as rows of domain-coloured chips; trait words come last, as plain text
export function Skills({ groups }: { groups: SkillGroup[] }) {
  const ordered = [
    ...groups.filter((group) => !isWorkingStyle(group)),
    ...groups.filter(isWorkingStyle),
  ]
  const used = DOMAINS.filter((domain) =>
    groups.some(
      (group) =>
        !isWorkingStyle(group) &&
        group.items.some((item) => domainOf(group, item) === domain)
    )
  )

  return (
    <Section id="skills" title="Skills">
      {used.length > 1 && (
        <DomainLegend domains={used} className="mt-4 doc:mt-2" />
      )}
      <dl className="mt-3 doc:mt-1.5">
        {ordered.map((group) => (
          <div
            key={group.title}
            className={cn(
              "grid gap-x-12 gap-y-2 border-b py-3 text-[15px] md:grid-cols-[11.25rem_minmax(0,1fr)] doc:grid-cols-[8.5rem_minmax(0,1fr)] doc:gap-x-6 doc:py-1.5 doc:text-[14px]",
              isWorkingStyle(group) && "text-muted-foreground"
            )}
          >
            <dt className="pt-0.5 font-semibold">{group.title}</dt>
            <dd>
              {isWorkingStyle(group) ? (
                group.items.join(", ")
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <DomainChip key={item} domain={domainOf(group, item)}>
                      {item}
                    </DomainChip>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
