import Link from "next/link";
import Image from "next/image";
import { PROJECTS } from "@/lib/content";
import { SectionHead } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function HomeProjects() {
  // Criterio único de prominencia: el flag `featured` (igual que /escaparate y
  // el orden de /proyectos), no la posición en el array. Fallback a los 3
  // primeros si ningún proyecto está marcado.
  const flagged = PROJECTS.filter((p) => p.featured);
  const feat = (flagged.length ? flagged : PROJECTS).slice(0, 3);
  return (
    <section className="ak-section" id="proyectos">
      <SectionHead center eyebrow="casos de estudio" title="Proyectos destacados" />
      <div className="ak-zz">
        {feat.map((p, i) => (
          <article key={p.id} className={`ak-zz-row ${i % 2 ? "rev" : ""}`.trim()} data-reveal>
            <Link
              href={`/proyectos/${p.id}`}
              className={`ak-ph ak-zz-media ${p.image ? "" : "ak-ph-grad"}`.trim()}
            >
              {p.image ? (
                <Image
                  src={p.image}
                  alt={`Captura de ${p.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span className="ak-ph-label">screenshot del producto</span>
              )}
            </Link>
            <div>
              <div className="ak-zz-idx">
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>/ {p.category}</span>
              </div>
              <h3 className="ak-zz-title">{p.title}</h3>
              <p className="ak-zz-desc">{p.desc}</p>
              <div className="ak-zz-tags">
                {p.tags.map((t) => (
                  <span key={t} className="ak-tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="ak-zz-metrics">
                {p.metrics.map((m) => (
                  <div key={m.l} className={`ak-zz-metric ${m.acc ? "acc" : ""}`.trim()}>
                    <b>{m.v}</b>
                    <span>{m.l}</span>
                  </div>
                ))}
              </div>
              <Link className="ak-pcard-link" href={`/proyectos/${p.id}`}>
                Ver caso de estudio <Icon name="arrow-up-right" size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 44 }}>
        <Button variant="secondary" href="/proyectos">
          Ver todos los proyectos <Icon name="arrow-right" size={15} style={{ marginLeft: 6 }} />
        </Button>
      </div>
    </section>
  );
}
