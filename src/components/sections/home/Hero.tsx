import { HERO_STATS } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="ak-hero-c" data-screen-label="hero">
      <span className="ak-note" data-reveal>
        <span className="ak-status-dot" />
        Disponible · media jornada
      </span>
      <h1 className="ak-display" data-reveal data-reveal-delay="1">
        Seguridad, <em>tooling</em> e infraestructura que puedes auditar.
      </h1>
      <p className="ak-hero-c-lead" data-reveal data-reveal-delay="2">
        Construyo herramientas de seguridad, gateways de credenciales y aplicaciones fullstack en
        Rust, Python y TypeScript. Sistemas que verifican antes de modificar y que dejan registro de
        todo lo que hacen.
      </p>
      <div className="ak-hero-c-cta" data-reveal data-reveal-delay="2">
        <Button variant="primary" href="/proyectos">
          Ver mi trabajo
        </Button>
        <Button variant="secondary" href="/contacto">
          <Icon name="calendar" size={16} style={{ marginRight: 8 }} />
          Agenda una llamada
        </Button>
      </div>
      <div className="ak-hero-c-stats" data-reveal data-reveal-delay="3">
        {HERO_STATS.map(([n, l]) => (
          <div key={l} className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">{n}</span>
            <span className="ak-stat-lab">{l}</span>
          </div>
        ))}
      </div>
      <a href="#proyectos" className="ak-scroll-cue" aria-label="Bajar">
        <Icon name="arrow-down" size={22} />
      </a>
    </section>
  );
}
