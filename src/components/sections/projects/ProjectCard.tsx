import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProjectImage } from "@/components/ProjectImage";
import type { Project } from "@/lib/content/types";

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
}

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <article className="ak-project-card">
      <div className="ak-project-card-media">
        <ProjectImage
          id={project.id}
          alt=""
          className="ak-project-card-image"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
        <span className="ak-project-card-category">{project.category}</span>
      </div>

      <div className="ak-project-card-body">
        <header className="ak-project-card-header">
          <div>
            <span className="ak-project-card-kind">{project.kind}</span>
            <h3 className="ak-project-card-title">
              <Link href={`/proyectos/${project.id}`}>{project.title}</Link>
            </h3>
          </div>
          <span className="ak-project-card-year">{project.year}</span>
        </header>

        <p className="ak-project-card-summary">{project.desc}</p>

        <div className="ak-project-card-tags" aria-label={`Stack de ${project.title}`}>
          {project.tags.map((tag) => (
            <span key={tag} className="ak-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="ak-project-card-footer">
          <div className="ak-project-card-actions">
            {project.liveUrl && (
              <Button
                variant="primary"
                size="sm"
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver en vivo <Icon name="external-link" size={14} />
              </Button>
            )}
            {project.repoUrl && (
              <Button
                variant="secondary"
                size="sm"
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver código <Icon name="github-logo" size={14} />
              </Button>
            )}
            <Link className="ak-project-card-case" href={`/proyectos/${project.id}`}>
              Ver caso <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          <div className="ak-project-card-metrics" aria-label={`Métricas de ${project.title}`}>
            {project.metrics.slice(0, 2).map((metric) => (
              <span key={metric.l}>
                <strong className={metric.acc ? "accent" : undefined}>{metric.v}</strong>
                <small>{metric.l}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
