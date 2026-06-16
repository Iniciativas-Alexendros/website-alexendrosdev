import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PROJECTS, getProject, getCaseStudy } from "@/lib/content";
import type { CaseBlock } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/JsonLd";
import { makeCreativeWorkJsonLd, makeBreadcrumbJsonLd } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const description = p.metaDescription ?? p.desc.slice(0, 155);
  return {
    title: p.title,
    description,
    openGraph: { title: p.title, description, type: "article" },
  };
}

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
          <div className="ak-ph ak-prose-shot">
            <span className="ak-ph-label">{block.label}</span>
          </div>
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    case "quote":
      return (
        <blockquote>
          “{block.text}” — {block.author}
        </blockquote>
      );
    default:
      return null;
  }
}

export default async function ProjectCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const study = getCaseStudy(p);
  const idx = PROJECTS.findIndex((x) => x.id === p.id);
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <div className="ak-container">
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
      <section className="ak-detail-hero">
        <div className="ak-detail-meta">
          <span>{p.category}</span>
          <span>·</span>
          <span>{p.year}</span>
        </div>
        <h1 className="ak-detail-title">{p.title}</h1>
        <p className="ak-detail-sum">{study.summary}</p>
        {(p.liveUrl ?? p.repoUrl) && (
          <div className="ak-detail-actions">
            {p.liveUrl && (
              <Button variant="primary" href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="external-link" size={15} style={{ marginRight: 7 }} />
                Ver en vivo
              </Button>
            )}
            {p.repoUrl && (
              <Button variant="secondary" href={p.repoUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="github" size={15} style={{ marginRight: 7 }} />
                Repositorio
              </Button>
            )}
          </div>
        )}
      </section>

      <div className="ak-ph ak-ph-grad ak-hero-shot" data-reveal>
        <span className="ak-ph-label">imagen principal del producto</span>
      </div>

      <section className="ak-section" style={{ paddingTop: 36 }}>
        <div className="ak-case-grid">
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
              <section key={s.id}>
                <h2 id={s.id}>{s.title}</h2>
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </section>
            ))}
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
            <div className="ak-meta-card">
              <div className="ak-side-group-t" style={{ marginBottom: 10 }}>
                Stack
              </div>
              <div className="ak-pcard-tags">
                {p.tags.map((t) => (
                  <span key={t} className="ak-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="ak-section" style={{ paddingTop: 0 }}>
        <div className="ak-relnav">
          <Link className="prev" href={`/proyectos/${prev.id}`}>
            <div className="dir">← Anterior</div>
            <div className="t">{prev.title}</div>
          </Link>
          <Link className="next" href={`/proyectos/${next.id}`}>
            <div className="dir">Siguiente →</div>
            <div className="t">{next.title}</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
