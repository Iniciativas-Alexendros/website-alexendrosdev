import { SITE } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "@/components/sections/NewsletterForm";

/**
 * Landing de "en construcción / publicación en breve".
 * Reutiliza el sistema de diseño Arctic Ocean (mismas clases que el hero):
 * logo, pastilla de estado, display heading, lead y enlaces sociales.
 */
export function ComingSoon() {
  return (
    <section
      className="ak-hero-c"
      data-screen-label="coming-soon"
      style={{ minHeight: "calc(100svh - 72px)", justifyContent: "center" }}
    >
      <div className="ak-logo" style={{ fontSize: 24, marginBottom: 18 }}>
        ~/<b>dev</b>
      </div>

      <span className="ak-note">
        <span className="ak-status-dot" />
        En construcción · {SITE.domain}
      </span>

      <h1 className="ak-display" style={{ maxWidth: "18ch" }}>
        Algo <em>está</em> en marcha.
      </h1>

      <p className="ak-hero-c-lead">
        Estoy puliendo el nuevo portfolio de {SITE.name} — {SITE.role}. Publicación en breve; déjame
        tu email y te aviso en cuanto esté listo.
      </p>

      <div style={{ width: "min(420px, 100%)", marginTop: 28 }}>
        <NewsletterForm variant="coming" />
      </div>

      <div className="ak-footer-social" style={{ marginTop: 28, justifyContent: "center" }}>
        <a aria-label="GitHub" href={SITE.socials.github}>
          <Icon name="github" size={18} />
        </a>
        <a aria-label="LinkedIn" href={SITE.socials.linkedin}>
          <Icon name="linkedin" size={18} />
        </a>
        <a aria-label="Email" href={`mailto:${SITE.email}`}>
          <Icon name="mail" size={18} />
        </a>
      </div>
    </section>
  );
}
