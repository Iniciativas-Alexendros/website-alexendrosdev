import Link from "next/link";
import { SITE } from "@/lib/content";
import { Icon } from "@/components/ui";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="ak-footer" role="contentinfo">
      <div className="ak-footer-cols">
        <div className="ak-footer-brand">
          <div className="ak-footer-logo" style={{ marginBottom: 10 }}>
            <span className="font-mono font-bold text-lg">alex</span>
            <span className="font-mono font-bold text-lg text-primary">endros</span>
          </div>
          <p className="ak-footer-tag">
            Desarrollo plataformas, webs y aplicaciones a medida. Tecnología moderna y código que es
            tuyo.
          </p>
          <div className="ak-footer-social">
            <a
              aria-label="GitHub"
              href={SITE.socials.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="github-logo" size={18} />
            </a>
            <a
              aria-label="LinkedIn"
              href={SITE.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="linkedin-logo" size={18} />
            </a>
            <a
              aria-label="alexendros.me"
              href={SITE.socials.web}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="globe" size={18} />
            </a>
            <a aria-label="Email" href={`mailto:${SITE.email}`}>
              <Icon name="envelope" size={18} />
            </a>
          </div>
        </div>
        <nav className="ak-footer-nav" aria-label="Navegación">
          <div className="ak-footer-ct">Navegación</div>
          <Link className="ak-footer-lk" href="/sobre-mi">
            Sobre mí
          </Link>
          <Link className="ak-footer-lk" href="/proyectos">
            Proyectos
          </Link>
          <Link className="ak-footer-lk" href="/stack">
            Stack
          </Link>
        </nav>
        <nav className="ak-footer-nav" aria-label="Recursos">
          <div className="ak-footer-ct">Recursos</div>
          <Link className="ak-footer-lk" href="/servicios">
            Servicios
          </Link>
          <a className="ak-footer-lk" href="/feed.xml">
            RSS
          </a>
        </nav>
        <div className="ak-footer-newsletter">
          <div className="ak-footer-ct">Newsletter</div>
          <p className="ak-footer-tag" style={{ marginBottom: 10 }}>
            Notas sobre desarrollo web, productos digitales e ingeniería, sin spam.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="ak-footer-bottom">
        <span className="font-mono text-caption">
          © 2026 {SITE.name} · {SITE.domain} · Construido con Next.js
        </span>
        <nav className="ak-footer-legal" aria-label="Enlaces legales">
          <Link className="ak-footer-lk" href="/legal/privacidad">
            Privacidad
          </Link>
          <Link className="ak-footer-lk" href="/legal/aviso-legal">
            Aviso legal
          </Link>
          <Link className="ak-footer-lk" href="/legal/condiciones">
            Condiciones
          </Link>
          <Link className="ak-footer-lk" href="/legal/cookies">
            Cookies
          </Link>
        </nav>
      </div>
    </footer>
  );
}
