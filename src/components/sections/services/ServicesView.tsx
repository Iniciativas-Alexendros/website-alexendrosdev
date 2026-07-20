"use client";

import { useState } from "react";
import { TIERS, COMPARISON, FAQ, ADDONS } from "@/lib/content/services";
import { Button, Icon, Reveal } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { makeProfessionalServiceJsonLd } from "@/lib/seo/jsonld";

function TierCard({ tier, index }: { tier: (typeof TIERS.proyecto)[0]; index: number }) {
  const isPro = tier.pro;
  return (
    <Reveal delay={index * 0.06}>
      <article className={`ak-tier ${isPro ? "pro" : ""}`}>
        {isPro && <span className="ak-tier-badge">Recomendado</span>}
        <div className="ak-tier-name">{tier.name}</div>
        <div className="ak-tier-price">
          {tier.price}
          <span className="ak-tier-unit">{tier.unit}</span>
        </div>
        <ul className="ak-tier-feats">
          {tier.feats.map(([text, included], i) => (
            <li key={i} className={included ? "" : "off"}>
              <Icon name={included ? "check" : "x"} size={14} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={isPro ? "primary" : "secondary"}
          size="lg"
          className="ak-tier-cta"
          href="/contacto"
        >
          {isPro ? "Empezar este plan" : "Elegir este plan"}
        </Button>
      </article>
    </Reveal>
  );
}

function ComparisonTable() {
  return (
    <Reveal>
      <div className="ak-comparison-wrap">
        <table className="ak-comparison">
          <thead>
            <tr>
              <th scope="col"></th>
              {TIERS.proyecto.map((t) => (
                <th key={t.name} scope="col">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(([label, values], i) => (
              <tr key={i}>
                <td>{label}</td>
                {values.map((v, j) => (
                  <td key={j}>
                    <Icon name={v ? "check" : "x"} size={16} className={v ? "yes" : "no"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (i: number, isOpen: boolean) => {
    queueMicrotask(() => {
      if (isOpen) {
        setOpenIndex(i);
      } else if (openIndex === i) {
        setOpenIndex(null);
      }
    });
  };

  return (
    <Reveal>
      <div className="ak-faq">
        <h2 className="ak-h2" style={{ marginBottom: 24 }}>
          Preguntas frecuentes
        </h2>
        {FAQ.map((item, i) => (
          <details
            key={i}
            className={`ak-faq-item ${openIndex === i ? "open" : ""}`}
            open={openIndex === i}
            onToggle={(e) => handleToggle(i, e.currentTarget.open)}
          >
            <summary>
              <span>{item.q}</span>
              <Icon name="chevron-down" size={18} className="ak-faq-icon" />
            </summary>
            <div className="ak-faq-answer">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </Reveal>
  );
}

function AddonsSection() {
  return (
    <section className="ak-section ak-addons">
      <div className="ak-section-head ak-center">
        <h2 className="ak-h2">Extras a la carta</h2>
        <p className="ak-section-sub">Servicios puntuales sin compromiso de continuidad.</p>
      </div>
      <div className="ak-addons-grid">
        {ADDONS.map((a, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <article className="ak-addon">
              <h3>{a.name}</h3>
              <p>{a.desc}</p>
              <div className="ak-addon-price">{a.price}</div>
              <Button variant="secondary" size="sm" href="/contacto">
                Consultar
              </Button>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function ServicesView() {
  return (
    <>
      <JsonLd data={makeProfessionalServiceJsonLd()} />
      <header className="ak-page-head">
        <h1 className="ak-page-title">Servicios</h1>
        <p className="ak-page-lead">
          Desarrollo de webs, aplicaciones y plataformas a medida. Planes por proyecto o cuota
          mensual, precios cerrados y contenidos para empresas nuevas y pequeñas.
        </p>
      </header>

      <section className="ak-section ak-tiers">
        <div className="ak-section-head ak-center">
          <h2 className="ak-h2">Planes por proyecto</h2>
          <p className="ak-section-sub">
            Tres niveles. Eliges el que encaja. Sin sorpresas, sin letra pequeña.
          </p>
        </div>
        <div className="ak-tiers-grid">
          {TIERS.proyecto.map((t, i) => (
            <TierCard key={t.name} tier={t} index={i} />
          ))}
        </div>
      </section>

      <section className="ak-section ak-comparison-sec">
        <div className="ak-section-head ak-center">
          <h2 className="ak-h2">Comparativa rápida</h2>
        </div>
        <ComparisonTable />
      </section>

      <FAQAccordion />

      <AddonsSection />

      <Reveal>
        <section className="ak-section ak-cta-lead">
          <div className="ak-cta-lead-inner">
            <h2 className="ak-display">¿Construimos algo juntos?</h2>
            <p className="ak-cta-lead-sub">
              Cuéntame tu proyecto y te paso propuesta sin compromiso en 48h.
            </p>
            <Button variant="primary" size="lg" href="/contacto">
              Hablemos &rarr;
            </Button>
          </div>
        </section>
      </Reveal>
    </>
  );
}
