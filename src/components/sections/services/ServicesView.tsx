"use client";

import { useState } from "react";
import { COMPARISON, FAQ, TIERS, PURCHASABLES } from "@/lib/content";
import type { Tier } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow, SectionHead } from "@/components/ui/SectionHead";
import { PurchaseCard } from "@/components/sections/checkout/PurchaseCard";

type Mode = "proyecto" | "retainer";

function AddonsSection() {
  return (
    <section className="ak-section" style={{ paddingTop: 8 }}>
      <SectionHead eyebrow="extras" title="Servicios puntuales" />
      <div className="ak-pricing">
        {PURCHASABLES.map((item) => (
          <PurchaseCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function PricingToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="ak-toggle" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "proyecto"}
        className={mode === "proyecto" ? "on" : ""}
        onClick={() => setMode("proyecto")}
      >
        Por proyecto
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "retainer"}
        className={mode === "retainer" ? "on" : ""}
        onClick={() => setMode("retainer")}
      >
        Retainer mensual
      </button>
    </div>
  );
}

function TierCard({ t, mode }: { t: Tier; mode: Mode }) {
  const isProject = mode === "proyecto";
  return (
    <div className={`ak-tier ${t.pro ? "ak-tier-pro" : ""}`.trim()}>
      {t.pro && (
        <span className="ak-tier-badge">
          <Icon name="star" size={12} />
          Más elegido
        </span>
      )}
      <div className="ak-tier-name">{t.name}</div>
      <div className="ak-tier-price">
        {t.price}
        <small>{t.unit}</small>
      </div>
      <ul className="ak-tier-feats">
        {t.feats.map(([f, on]) => (
          <li key={f} className={on ? "" : "off"}>
            <Icon name={on ? "check" : "minus"} size={15} />
            {f}
          </li>
        ))}
      </ul>
      {isProject && (
        <p
          className="ak-tier-note"
          style={{
            fontSize: "12px",
            color: "var(--ak-mute, #6b7785)",
            marginTop: 4,
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          Precio orientativo. Tras la discovery call entregamos presupuesto cerrado.
        </p>
      )}
      <Button
        variant={t.pro ? "primary" : "secondary"}
        href="/contacto"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {isProject ? "Pedir presupuesto" : "Empezar"}
      </Button>
    </div>
  );
}

function Comparison() {
  return (
    <section className="ak-section" style={{ paddingTop: 8 }}>
      <SectionHead eyebrow="comparativa" title="Qué incluye cada plan" />
      <div className="ak-cmp">
        <div className="ak-cmp-row ak-cmp-head">
          <span>Característica</span>
          <span>Starter</span>
          <span>Pro</span>
          <span>Scale</span>
        </div>
        {COMPARISON.map(([feat, cells]) => (
          <div key={feat} className="ak-cmp-row ak-cmp-body">
            <span className="ak-cmp-feat">{feat}</span>
            {cells.map((on, i) => (
              <span key={`${feat}-cell-${i}`} className="ak-cmp-cell">
                {on ? (
                  <Icon name="check" size={16} className="yes" />
                ) : (
                  <span className="no">—</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="ak-section">
      <SectionHead center eyebrow="dudas" title="Preguntas frecuentes" />
      <div className="ak-faq">
        {FAQ.map((f, i) => (
          <div key={i} className={`ak-faq-item ${open === i ? "open" : ""}`.trim()}>
            <button
              type="button"
              className="ak-faq-q"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
            >
              {f.q}
              <span className="ic">
                <Icon name="plus" size={18} />
              </span>
            </button>
            <div className="ak-faq-a">
              <div className="ak-faq-a-in">{f.a}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicesView() {
  const [mode, setMode] = useState<Mode>("proyecto");
  return (
    <div className="ak-container">
      <section className="ak-services-hero" data-screen-label="header">
        <Eyebrow>servicios</Eyebrow>
        <h1 className="ak-page-title">Planes claros, sin sorpresas</h1>
        <p className="ak-page-lead">
          Desarrollo de webs, aplicaciones y plataformas a medida. Precios cerrados y contenidos,
          pensados para empresas nuevas y pequeñas.
        </p>
        <div style={{ marginTop: 8 }}>
          <PricingToggle mode={mode} setMode={setMode} />
        </div>
      </section>
      <section className="ak-section" style={{ paddingTop: 28 }}>
        <div className="ak-pricing">
          {TIERS[mode].map((t) => (
            <TierCard key={t.name} t={t} mode={mode} />
          ))}
        </div>
      </section>
      <Comparison />
      <AddonsSection />
      <FaqSection />
    </div>
  );
}
