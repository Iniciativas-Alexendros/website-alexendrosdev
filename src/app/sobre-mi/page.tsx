import type { Metadata } from "next";
import { ABOUT_STATS, DAILY_STACK, PRINCIPLES, TIMELINE } from "@/lib/content";
import type { TimelineEntry } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName, Reveal } from "@/components/ui";
import { Eyebrow, SectionHead } from "@/components/ui/SectionHead";

export const metadata: Metadata = {
  title: "Sobre mí",
  description:
    "Desarrollador en Valencia. Diseño y construyo webs, aplicaciones y plataformas a medida con tecnología moderna (Next.js, React, TypeScript) y backend propio.",
};

function AboutIntro() {
  return (
    <section className="ak-about-hero" data-screen-label="intro">
      <Reveal>
        <span className="ak-avatar" />
      </Reveal>
      <Reveal delay={0.06}>
        <Eyebrow>sobre mí</Eyebrow>
      </Reveal>
      <Reveal delay={0.12}>
        <h1 className="ak-page-title">Construyo el producto digital que tu negocio necesita</h1>
      </Reveal>
      <Reveal delay={0.18}>
        <p className="ak-page-lead">
          Soy Alejandro Domingo Agustí (Alexendros), desarrollador en Valencia. Diseño y construyo
          webs, aplicaciones y plataformas a medida con tecnología moderna (Next.js, React,
          TypeScript) y backend propio. Me importa entregar cosas que funcionen, sin sorpresas en la
          factura, con código que es tuyo y construido de forma segura desde el primer día.
        </p>
      </Reveal>
      <Reveal delay={0.24}>
        <div className="ak-about-cta">
          {/* CV próximamente */}
          <Button variant="secondary" href="/contacto">
            Contacto
          </Button>
        </div>
      </Reveal>
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
          <li key={`${it.role}-bullet-${i}`}>{b}</li>
        ))}
      </ul>
      {it.link && (
        <a
          className="ak-pcard-link"
          href={it.link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginBottom: 12 }}
        >
          {it.link.label}
        </a>
      )}
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
        <Reveal key={i} delay={i * 0.06} className={`ak-tl2-item ${i % 2 ? "right" : "left"}`}>
          <span className="ak-tl2-dot" />
          <TimelineCard it={it} />
        </Reveal>
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
          <Reveal key={p.title} delay={(i % 3) * 0.1}>
            <div className="ak-principle">
              <span className="ak-principle-ic">
                <Icon name={p.icon as IconName} size={20} />
              </span>
              <h3 className="ak-principle-title">{p.title}</h3>
              <p className="ak-principle-body">{p.body}</p>
            </div>
          </Reveal>
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
