"use client";

import Link from "next/link";
import Image from "next/image";
import { PROJECTS, PURCHASABLES } from "@/lib/content";
import { Eyebrow, SectionHead } from "@/components/ui/SectionHead";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PurchaseCard } from "@/components/sections/checkout/PurchaseCard";

export function EscaparateView() {
  const featured = PROJECTS.filter((p) => p.featured);

  return (
    <div className="ak-container">
      <section className="ak-page-head" data-screen-label="header">
        <Eyebrow>escaparate</Eyebrow>
        <h1 className="ak-page-title">Escaparate</h1>
        <p className="ak-page-lead">
          Una selección curada: los proyectos que mejor resumen mi trabajo y los servicios que
          puedes contratar al instante. El escaparate, sin rodeos.
        </p>
      </section>

      <section className="ak-section" style={{ paddingTop: 14 }}>
        <SectionHead eyebrow="trabajo destacado" title="Proyectos en vitrina" />
        <div className="ak-zz">
          {featured.map((p, i) => (
            <article key={p.id} className={`ak-zz-row ${i % 2 ? "rev" : ""}`.trim()}>
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
          <Button variant="ghost" href="/proyectos">
            Ver todos los proyectos <Icon name="arrow-right" size={15} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      </section>

      <section className="ak-section" style={{ paddingTop: 8 }}>
        <SectionHead
          eyebrow="contratación directa"
          title="Listo para comprar"
          sub="Servicios puntuales con precio cerrado. Pago seguro con Stripe y confirmación al instante."
        />
        <div className="ak-pricing">
          {PURCHASABLES.map((item) => (
            <PurchaseCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="ak-section">
        <SectionHead
          center
          eyebrow="¿algo a medida?"
          title="¿No encaja en el escaparate?"
          sub="Si tu proyecto necesita algo distinto, cuéntamelo y preparamos una propuesta a medida."
        />
        <div style={{ textAlign: "center" }}>
          <Button variant="primary" href="/contacto">
            Hablemos <Icon name="arrow-right" size={15} style={{ marginLeft: 6 }} />
          </Button>
        </div>
      </section>
    </div>
  );
}
