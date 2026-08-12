"use client";

import { PROJECTS } from "@/lib/content/projects";
import { ProjectImage } from "@/components/ProjectImage";
import { Icon, Button, ButtonLink, Reveal } from "@/components/ui";

const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured).map((p) => ({
  slug: p.id,
  title: p.title,
  description: p.desc,
  category: p.category,
  tags: p.tags,
  metrics: p.metrics.map((m) => ({
    label: m.l,
    value: m.v,
    accent: m.acc,
  })),
  liveUrl: p.liveUrl,
  repoUrl: p.repoUrl,
}));

export function HomeFeaturedProjects() {
  return (
    <section className="ak-section" aria-labelledby="featured-projects-heading">
      <div className="ak-container">
        <header className="ak-section-head ak-center">
          <h2 id="featured-projects-heading" className="ak-h2">
            Proyectos destacados
          </h2>
          <p className="ak-section-sub">
            Selección de trabajos recientes. Cada uno resuelve un problema real con tecnología
            moderna.
          </p>
        </header>

        <div className="ak-zz">
          {FEATURED_PROJECTS.map((project, i) => (
            <Reveal
              key={project.slug}
              delay={i * 0.06}
              className={`ak-zz-row ${i % 2 === 1 ? "rev" : ""}`}
            >
              <div className="ak-zz-media">
                <ProjectImage
                  id={project.slug}
                  alt={project.title}
                  sizes="(max-width: 880px) 100vw, 540px"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="ak-zz-body">
                <span className="ak-zz-cat">{project.category}</span>
                <h3 className="ak-zz-title">{project.title}</h3>
                <p className="ak-zz-desc">{project.description}</p>
                <div className="ak-zz-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="ak-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="ak-zz-metrics">
                  {project.metrics.map((m, j) => (
                    <div key={j} className="ak-zz-metric" style={{ flex: 1 }}>
                      <b className={m.accent ? "acc" : ""}>{m.value}</b>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
                <div className="ak-zz-actions">
                  {project.liveUrl && (
                    <ButtonLink
                      variant="primary"
                      size="sm"
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en vivo <Icon name="arrow-up-right" size={14} />
                    </ButtonLink>
                  )}
                  {project.repoUrl && (
                    <ButtonLink
                      variant="secondary"
                      size="sm"
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Código <Icon name="github-logo" size={14} />
                    </ButtonLink>
                  )}
                  <Button variant="ghost" size="sm" href={`/proyectos/${project.slug}`}>
                    Ver caso →
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 44 }}>
          <Button variant="secondary" size="lg" href="/proyectos">
            Ver todos los proyectos <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}
