"use client";

import { Button } from "@/components/ui";

export function HomeCTA() {
  return (
    <section className="ak-section ak-cta-lead" aria-labelledby="cta-heading">
      <div className="ak-container">
        <header className="ak-section-head ak-center">
          <h2 id="cta-heading" className="ak-display">
            ¿Construimos algo juntos?
          </h2>
          <p className="ak-section-sub">
            Cuéntame tu proyecto y te paso propuesta sin compromiso en 48h.
          </p>
        </header>
        <div className="ak-hero-c-cta">
          <Button variant="primary" size="lg" href="/contacto">
            Hablemos <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
