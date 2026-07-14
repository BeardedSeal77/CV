import { Check, ExternalLink } from "lucide-react"

import { Section } from "@/components/site/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Project } from "@/lib/content"
import { cn } from "@/lib/utils"

function FeaturedProject({ project }: { project: Project }) {
  return (
    <article className="overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10">
      <div
        aria-hidden
        className="h-1.5 w-full bg-linear-to-r from-primary to-brand-2"
      />
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-2xl font-bold tracking-tight">
              {project.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-primary">
              {project.subtitle}
            </p>
          </div>
          {project.status && (
            <Badge variant="secondary">{project.status}</Badge>
          )}
        </div>

        <div
          className="markdown mt-4 max-w-3xl text-base text-foreground/80"
          dangerouslySetInnerHTML={{ __html: project.html }}
        />

        {project.features && (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
            {project.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <Check className="size-4 shrink-0 text-primary" />
                {feature}
              </div>
            ))}
          </div>
        )}

        {project.impact && (
          <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Impact: </span>
            {project.impact}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  )
}

function ProjectCard({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{project.title}</CardTitle>
        <CardDescription className="font-medium text-primary">
          {project.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div
          className="markdown text-sm text-foreground/80"
          dangerouslySetInnerHTML={{ __html: project.html }}
        />

        {project.features && (
          <ul className="space-y-1.5">
            {project.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-2 text-sm text-foreground/80"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {project.minis && (
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {project.minis.map((mini) => (
              <div key={mini.name}>
                <h4 className="text-sm font-medium">{mini.name}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mini.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {project.links && (
          <div className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <Button
                key={link.href}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={link.href} target="_blank" rel="noreferrer" />}
              >
                {link.label}
                <ExternalLink data-icon="inline-end" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Projects({ projects }: { projects: Project[] }) {
  const featured = projects.filter((project) => project.featured)
  const rest = projects.filter((project) => !project.featured)

  return (
    <Section id="projects" title="Projects">
      <div className="space-y-6">
        {featured.map((project) => (
          <FeaturedProject key={project.title} project={project} />
        ))}
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map((project) => (
            <ProjectCard
              key={project.title}
              project={project}
              className={project.minis ? "md:col-span-2" : undefined}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
