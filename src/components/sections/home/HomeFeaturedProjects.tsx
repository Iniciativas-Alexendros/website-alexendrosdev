"use client";

import Image from "next/image";
import Link from "next/link";
import { getProjectImageOrGradient } from "@/lib/project-images";
import { Icon, Button, Reveal } from "@/components/ui";

interface Project {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  metrics: { label: string; value: string; accent?: boolean }[];
  imageSeed: string;
  liveUrl?: string;
  repoUrl?: string;
}

const PROJECTS: Project[] = [
  {
    slug: "alexendros-me",
    title: "Alexendros.me — Portfolio & blog",
    description:
      "Sitio personal con blog MDX, proyectos, stack interactivo y timeline de experiencia. Next.js 16, Tailwind v4, design system Arctic Ocean.",
    category: "Portfolio",
    tags: ["Next.js", "Tailwind", "MDX", "TypeScript"],
    metrics: [
      { label: "Tests", value: "358" },
      { label: "Cobertura", value: "87%", accent: true },
    ],
    imageSeed: "alexendros-portfolio",
    liveUrl: "https://alexendros.dev",
    repoUrl: "https://github.com/alexendros/website-alexendrosdev",
  },
  {
    slug: "nasve",
    title: "Nasve — E-commerce artesanal",
    description:
      "Tienda online para cerámica artesanal. Carrito, checkout Stripe, panel admin, emails transaccionales, sincronización Notion CRM.",
    category: "E-commerce",
    tags: ["Next.js", "Stripe", "Prisma", "Supabase", "Resend"],
    metrics: [
      { label: "Pedidos/mes", value: "120+" },
      { label: "Conversión", value: "3.2%", accent: true },
    ],
    imageSeed: "nasve-shop",
    liveUrl: "https://ecommerce-graficasnasve.vercel.app",
  },
  {
    slug: "pipeline-crm",
    title: "Pipeline CRM — Pipeline 9 etapas",
    description:
      "CRM ligero para freelances: contactos, deals, 9 etapas, actividades, facturas, webhook Notion bidireccional, API REST 8 endpoints.",
    category: "SaaS",
    tags: ["Next.js", "tRPC", "PostgreSQL", "Notion API", "Docker"],
    metrics: [
      { label: "Endpoints", value: "8" },
      { label: "Stages", value: "9", accent: true },
    ],
    imageSeed: "pipeline-crm",
    liveUrl: "https://crm.alexendros.dev",
  },
];

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
          {PROJECTS.map((project, i) => (
            <Reveal
              key={project.slug}
              delay={i * 0.06}
              className={`ak-zz-row ${i % 2 === 1 ? "rev" : ""}`}
            >
              <div className="ak-zz-media">
                {(() => {
                  const img = getProjectImageOrGradient(project.slug);
                  return img.type === "image" ? (
                    <Image
                      src={img.src}
                      alt={project.title}
                      fill
                      sizes="(max-width: 880px) 100vw, 540px"
                    />
                  ) : (
                    <div
                      style={{
                        background: img.style,
                        width: "100%",
                        height: "100%",
                        minHeight: 300,
                      }}
                      aria-hidden="true"
                    />
                  );
                })()}
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
                    <Link
                      className="ak-btn ak-btn-primary ak-btn-sm"
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en vivo <Icon name="arrow-up-right" size={14} />
                    </Link>
                  )}
                  {project.repoUrl && (
                    <Link
                      className="ak-btn ak-btn-secondary ak-btn-sm"
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Código <Icon name="github-logo" size={14} />
                    </Link>
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
