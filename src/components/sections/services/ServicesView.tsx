"use client";

import { useState } from "react";
import { TIERS, COMPARISON, FAQ, ADDONS } from "@/lib/content/services";
import { Button, Icon, Reveal } from "@/components/ui";
import { cn } from "@/lib/utils";

function TierCard({ tier, index }: { tier: (typeof TIERS.proyecto)[0]; index: number }) {
  const isPro = tier.pro;
  return (
    <Reveal delay={index * 0.06}>
      <article
        className={cn(
          "relative flex flex-col rounded-xl border border-border-subtle bg-elevated p-6 shadow-sm",
          isPro && "scale-[1.03] border-2 border-primary shadow-lg",
        )}
      >
        {isPro && (
          <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-cta px-3 py-1 text-xs font-semibold text-on-primary">
            Recomendado
          </span>
        )}
        <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {tier.name}
        </div>
        <div className="break-words text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {tier.price}
          <span className="ml-1 text-sm font-normal text-muted">{tier.unit}</span>
        </div>
        <ul className="mb-6 mt-5 flex list-none flex-col gap-2.5 p-0">
          {tier.feats.map(([text, included], i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 text-sm",
                included ? "text-text-secondary" : "text-muted",
              )}
            >
              <Icon name={included ? "check" : "x"} size={14} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={isPro ? "primary" : "secondary"}
          size="lg"
          className="mt-auto"
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
      <div className="sv-comparison-wrap">
        <table className="sv-comparison">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Característica
              </th>
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
                    <Icon
                      name={v ? "check" : "x"}
                      size={16}
                      className={v ? "text-success" : "text-muted"}
                    />
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
      <div className="flex flex-col">
        <h2 className="ak-h2" style={{ marginBottom: 24 }}>
          Preguntas frecuentes
        </h2>
        {FAQ.map((item, i) => (
          <details
            key={i}
            className={cn("sv-faq-item", openIndex === i && "open")}
            open={openIndex === i}
            onToggle={(e) => handleToggle(i, e.currentTarget.open)}
          >
            <summary>
              <span>{item.q}</span>
              <Icon name="chevron-down" size={18} className="sv-faq-icon" />
            </summary>
            <div className="sv-faq-answer">
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
    <Reveal>
      <section className="ak-section">
        <div className="ak-section-head ak-center">
          <h2 className="ak-h2">Extras a la carta</h2>
          <p className="ak-section-sub">Servicios puntuales sin compromiso de continuidad.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <article className="flex h-full flex-col rounded-xl border border-border-subtle bg-elevated p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="mb-2 text-base font-semibold text-foreground">{a.name}</h3>
                <p className="mb-4 text-sm leading-relaxed text-text-secondary">{a.desc}</p>
                <div className="mb-3 mt-auto text-xl font-bold text-link">{a.price}</div>
                <Button variant="secondary" size="sm" href="/contacto">
                  Consultar
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export default function ServicesView() {
  return (
    <>
      <header className="ak-page-head">
        <h1 className="ak-page-title">Servicios</h1>
        <p className="ak-page-lead">
          Desarrollo de webs, aplicaciones y plataformas a medida. Planes por proyecto o cuota
          mensual, precios cerrados y contenidos para empresas nuevas y pequeñas.
        </p>
      </header>

      <Reveal delay={0.06}>
        <section className="ak-section">
          <div className="ak-section-head ak-center">
            <h2 className="ak-h2">Planes por proyecto</h2>
            <p className="ak-section-sub">
              Tres niveles. Eliges el que encaja. Sin sorpresas, sin letra pequeña.
            </p>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.proyecto.map((t, i) => (
              <TierCard key={t.name} tier={t} index={i} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="ak-section">
          <div className="ak-section-head ak-center">
            <h2 className="ak-h2">Comparativa rápida</h2>
          </div>
          <ComparisonTable />
        </section>
      </Reveal>

      <AddonsSection />

      <FAQAccordion />

      <Reveal>
        <section className="ak-section ak-cta-lead">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-8 py-14 text-center">
            <h2 className="ak-display">¿Construimos algo juntos?</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">
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
