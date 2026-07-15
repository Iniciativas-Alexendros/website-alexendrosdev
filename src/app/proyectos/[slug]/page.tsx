import Link from "next/link";
import { PROJECTS, getProject, getCaseStudy } from "@/lib/content";
import type { CaseBlock } from "@/lib/content/case-studies";
import { Button } from "@/components/ui/Button";
import { Icon, Reveal } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { makeCreativeWorkJsonLd, makeBreadcrumbJsonLd } from "@/lib/seo/jsonld";

function Block({ block }: { block: CaseBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "callout":
      return (
        <div className="ak-callout">
          <span className="ic">
            <Icon name="info" size={18} />
          </span>
          <p>{block.text}</p>
        </div>
      );
    case "code":
      return (
        <div className="ak-code">
          <div className="ak-code-bar">{block.file}</div>
          <pre>{block.code}</pre>
        </div>
      );
    case "figure":
      return (
        <figure>
          <img
            src={`https://picsum.photos/seed/${block.label?.replace(/\s+/g, "-").toLowerCase() ?? "shot"}/1200/675`}
            alt={block.caption ?? ""}
            className="ak-prose-shot"
            loading="lazy"
          />
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    case "quote":
      return (
        <blockquote>
          &ldquo;{block.text}&rdquo; &mdash; {block.author}
        </blockquote>
      );
    default:
      return null;
  }
}

export default async function ProjectCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) {
    return (
      <div className="ak-container">
        <h1 className="ak-page-title">Proyecto no encontrado</h1>
        <p className="ak-page-lead">El proyecto solicitado no existe.</p>
        <Button variant="secondary" href="/proyectos">
          Volver a proyectos
        </Button>
      </div>
    );
  }

  const study = getCaseStudy(p);
  const idx = PROJECTS.findIndex((x) => x.id === p.id);
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <div className="ak-container ak-detail-page">
      <JsonLd data={makeCreativeWorkJsonLd(p)} />
      <JsonLd
        data={makeBreadcrumbJsonLd([
          { name: "Inicio", url: "https://alexendros.dev" },
          { name: "Proyectos", url: "https://alexendros.dev/proyectos" },
          { name: p.title, url: `https://alexendros.dev/proyectos/${p.id}` },
        ])}
      />

      <Link className="ak-back" href="/proyectos">
        <Icon name="arrow-left" size={15} />
        Proyectos
      </Link>

      <header className="ak-detail-hero">
        <div className="ak-detail-meta">
          <span>{p.category}</span>
          <span>&middot;</span>
          <span>{p.year}</span>
        </div>
        <h1 className="ak-detail-title">{p.title}</h1>
        <p className="ak-detail-sum">{study.summary}</p>
        {(p.liveUrl || p.repoUrl) && (
          <div className="ak-detail-actions">
            {p.liveUrl && (
              <Button variant="primary" href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="external-link" size={15} style={{ marginRight: 7 }} />
                Ver en vivo
              </Button>
            )}
            {p.repoUrl && (
              <Button
                variant="secondary"
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="github" size={15} style={{ marginRight: 7 }} />
                Repositorio
              </Button>
            )}
          </div>
        )}
      </header>

      <Reveal>
        <img
          src={`https://picsum.photos/seed/${p.id}-hero/1920/1080`}
          alt={p.title}
          className="ak-hero-img"
          loading="eager"
        />
      </Reveal>

      <Reveal delay={0.06}>
        <section className="ak-case-layout">
          <article className="ak-prose">
            <div className="ak-case-metrics">
              {p.metrics.map((m) => (
                <div key={m.l} className="ak-case-metric">
                  <b>{m.v}</b>
                  <span>{m.l}</span>
                </div>
              ))}
            </div>

            {study.sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                {s.blocks.map((b, i) => (
                  <Block key={`${s.id}-block-${i}`} block={b} />
                ))}
              </section>
            ))}

            <div className="ak-stack-showcase">
              <h3>Stack</h3>
              <div className="ak-pcard-tags">
                {p.tags.map((t) => (
                  <span key={t} className="ak-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <aside className="ak-case-side">
            <div className="ak-meta-card">
              <div className="ak-meta-item">
                <span className="k">Rol</span>
                <span className="v">{study.role}</span>
              </div>
              <div className="ak-meta-item">
                <span className="k">Duración</span>
                <span className="v">{study.duration}</span>
              </div>
              <div className="ak-meta-item">
                <span className="k">Año</span>
                <span className="v">{p.year}</span>
              </div>
              <div className="ak-meta-item">
                <span className="k">Categoría</span>
                <span className="v">{p.category}</span>
              </div>
              <div className="ak-meta-item">
                <span className="k">Cliente</span>
                <span className="v">{study.client}</span>
              </div>
            </div>
          </aside>
        </section>
      </Reveal>

      <section className="ak-section" style={{ paddingTop: 0 }}>
        <div className="ak-relnav">
          <Link className="prev" href={`/proyectos/${prev.id}`}>
            <div className="dir">&larr; Anterior</div>
            <div className="t">{prev.title}</div>
          </Link>
          <Link className="next" href={`/proyectos/${next.id}`}>
            <div className="dir">Siguiente &rarr;</div>
            <div className="t">{next.title}</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
