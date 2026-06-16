import type { Metadata } from "next";
import { ABOUT_STATS, DAILY_STACK, PRINCIPLES, TIMELINE } from "@/lib/content";
import type { TimelineEntry } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow, SectionHead } from "@/components/ui/SectionHead";

export const metadata: Metadata = {
  title: "Sobre mí",
  description:
    "Desarrollador en Valencia. Diseño y construyo webs, aplicaciones y plataformas a medida con tecnología moderna (Next.js, React, TypeScript) y backend propio.",
};

function AboutIntro() {
  return (
    <section className="ak-about-hero" data-screen-label="intro">
      <span className="ak-avatar" data-reveal />
      <Eyebrow>sobre mí</Eyebrow>
      <h1 className="ak-page-title" data-reveal data-reveal-delay="1">
        Construyo el producto digital que tu negocio necesita
      </h1>
      <p className="ak-page-lead" data-reveal data-reveal-delay="2">
        Soy Alejandro Domingo Agustí (Alexendros), desarrollador en Valencia. Diseño y construyo
        webs, aplicaciones y plataformas a medida con tecnología moderna (Next.js, React,
        TypeScript) y backend propio. Me importa entregar cosas que funcionen, sin sorpresas en la
        factura, con código que es tuyo y construido de forma segura desde el primer día.
      </p>
      <div className="ak-about-cta" data-reveal data-reveal-delay="2">
        {/* CV próximamente */}
        <Button variant="secondary" href="/contacto">
          Contacto
        </Button>
      </div>
      <div className="ak-stat-row" style={{ justifyContent: "center", marginTop: 36 }}>
        {ABOUT_STATS.map(([n, l]) => (
          <div key={l} className="ak-stat" style={{ alignItems: "center" }}>
            <span className="ak-stat-num">{n}</span>
            <span className="ak-stat-lab">{l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineCard({ it }: { it: TimelineEntry }) {
  return (
    <div className={`ak-tl2-card ${it.now ? "now" : ""}`.trim()}>
      <div className="ak-tl2-head">
        <span className="ak-tl2-year">{it.year}</span>
        <span className="ak-tag" style={{ fontSize: 10 }}>
          remoto
        </span>
      </div>
      <h3 className="ak-tl2-role">{it.role}</h3>
      <div className="ak-tl2-org">{it.org}</div>
      <ul className="ak-tl2-list">
        {it.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <div className="ak-tl2-tags">
        {it.tags.map((t) => (
          <span key={t} className="ak-tag">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineAlt() {
  return (
    <div className="ak-tl2">
      <div className="ak-tl2-now">
        <span className="ak-note">
          <span className="ak-status-dot" />
          ahora
        </span>
      </div>
      {TIMELINE.map((it, i) => (
        <div key={i} className={`ak-tl2-item ${i % 2 ? "right" : "left"}`} data-reveal>
          <span className="ak-tl2-dot" />
          <TimelineCard it={it} />
        </div>
      ))}
    </div>
  );
}

function Principles() {
  return (
    <section className="ak-section">
      <SectionHead eyebrow="cómo trabajo" title="Principios" />
      <div className="ak-principles-3">
        {PRINCIPLES.map((p, i) => (
          <div
            key={p.title}
            className="ak-principle"
            data-reveal
            data-reveal-delay={String((i % 3) + 1)}
          >
            <span className="ak-principle-ic">
              <Icon name={p.icon as IconName} size={20} />
            </span>
            <h3 className="ak-principle-title">{p.title}</h3>
            <p className="ak-principle-body">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyStack() {
  return (
    <section className="ak-section" style={{ paddingTop: 0 }}>
      <SectionHead eyebrow="herramientas" title="Stack del día a día" />
      <div className="ak-chipcloud">
        {DAILY_STACK.map((t) => (
          <span key={t} className="ak-chip">
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="ak-container">
      <AboutIntro />
      <section className="ak-section" style={{ paddingTop: 40 }}>
        <SectionHead
          center
          eyebrow="trayectoria"
          title="Línea de carrera"
          sub="Del trabajo en abierto al desarrollo de plataformas, webs y aplicaciones."
        />
        <TimelineAlt />
      </section>
      <Principles />
      <DailyStack />
    </div>
  );
}
