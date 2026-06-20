import Link from "next/link";
import { SITE } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="ak-footer">
      <div className="ak-footer-cols">
        <div>
          <div className="ak-logo" style={{ marginBottom: 10 }}>
            alex<b>endros</b>
          </div>
          <p className="ak-footer-tag">
            Desarrollo plataformas, webs y aplicaciones a medida. Tecnología moderna y código que es
            tuyo.
          </p>
          <div className="ak-footer-social">
            <a aria-label="GitHub" href={SITE.socials.github}>
              <Icon name="github" size={18} />
            </a>
            <a aria-label="LinkedIn" href={SITE.socials.linkedin}>
              <Icon name="linkedin" size={18} />
            </a>
            <a aria-label="alexendros.me" href={SITE.socials.web}>
              <Icon name="external-link" size={18} />
            </a>
            <a aria-label="Email" href={`mailto:${SITE.email}`}>
              <Icon name="mail" size={18} />
            </a>
          </div>
        </div>
        <div>
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
          <Link className="ak-footer-lk" href="/blog">
            Blog
          </Link>
        </div>
        <div>
          <div className="ak-footer-ct">Recursos</div>
          <Link className="ak-footer-lk" href="/servicios">
            Servicios
          </Link>
          {/* CV PDF — próximamente */}
          {/* Uses / setup — próximamente */}
          <a className="ak-footer-lk" href="/feed.xml">
            RSS
          </a>
        </div>
        <div>
          <div className="ak-footer-ct">Newsletter</div>
          <p className="ak-footer-tag" style={{ marginBottom: 10 }}>
            Notas sobre desarrollo web, productos digitales e ingeniería, sin spam.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="ak-footer-bottom">
        <span>
          © 2026 {SITE.name} · {SITE.domain} · Construido con Next.js
        </span>
        <span className="ak-footer-legal">
          <span
            className="ak-footer-lk opacity-50 cursor-not-allowed"
            style={{ display: "inline", margin: 0 }}
          >
            Privacidad
          </span>
          <span
            className="ak-footer-lk opacity-50 cursor-not-allowed"
            style={{ display: "inline", margin: 0 }}
          >
            Aviso legal
          </span>
        </span>
      </div>
    </footer>
  );
}
