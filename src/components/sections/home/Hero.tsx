"use client";

import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="ak-hero-c" aria-labelledby="hero-title">
      <div className="ak-container">
        <h1
          id="hero-title"
          className="ak-display"
          style={{ maxWidth: "16ch", margin: "22px auto 0" }}
        >
          Desarrollo de plataformas, webs y <em>apps</em> a medida.
        </h1>
        <p className="ak-hero-c-lead">
          Ayudo a empresas nuevas y pequeñas de toda España a lanzar productos digitales con
          tecnología moderna, código que es tuyo y precios pensados para ti.
        </p>
        <div className="ak-hero-c-cta">
          <Button variant="primary" size="lg" href="/proyectos">
            Ver mi trabajo
          </Button>
          <Button variant="secondary" size="lg" href="/contacto">
            Agenda una llamada
          </Button>
        </div>
        <div className="ak-hero-c-stats">
          <div className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">5</span>
            <span className="ak-stat-lab">Proyectos</span>
          </div>
          <div className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">4</span>
            <span className="ak-stat-lab">Lenguajes</span>
          </div>
          <div className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">100%</span>
            <span className="ak-stat-lab">Tuyo</span>
          </div>
          <div className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">0</span>
            <span className="ak-stat-lab">Ataduras</span>
          </div>
        </div>
      </div>
    </section>
  );
}
