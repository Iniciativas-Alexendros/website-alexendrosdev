import { HERO_STATS } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="ak-hero-c" data-screen-label="hero">
      <span className="ak-note" data-reveal>
        <span className="ak-status-dot" />
        Disponible para proyectos
      </span>
      <h1 className="ak-display" data-reveal data-reveal-delay="1">
        Desarrollo de plataformas, webs y <em>apps</em> a medida en Valencia.
      </h1>
      <p className="ak-hero-c-lead" data-reveal data-reveal-delay="2">
        Diseño y desarrollo el producto digital que necesitas —desde una web hasta una plataforma
        completa— con tecnología moderna y código que de verdad es tuyo. Trabajo desde Valencia para
        empresas nuevas y pequeñas de toda España: rápido, fiable y seguro desde el primer día.
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
