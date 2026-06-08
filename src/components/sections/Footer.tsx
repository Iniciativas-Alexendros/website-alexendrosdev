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
            Software &amp; Platform Engineer. Seguridad, tooling e infraestructura que puedes
            auditar.
          </p>
          <div className="ak-footer-social">
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
          <a className="ak-footer-lk" href="#">
            CV (PDF)
          </a>
          <a className="ak-footer-lk" href="#">
            Uses / setup
          </a>
          <a className="ak-footer-lk" href="/feed.xml">
            RSS
          </a>
        </div>
        <div>
          <div className="ak-footer-ct">Newsletter</div>
          <p className="ak-footer-tag" style={{ marginBottom: 10 }}>
            Notas sobre seguridad, tooling e ingeniería, sin spam.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="ak-footer-bottom">
        <span>
          © 2026 {SITE.name} · {SITE.domain} · Construido con Next.js
        </span>
        <span className="ak-footer-legal">
          <a className="ak-footer-lk" style={{ display: "inline", margin: 0 }} href="#">
            Privacidad
          </a>
          <a className="ak-footer-lk" style={{ display: "inline", margin: 0 }} href="#">
            Aviso legal
          </a>
        </span>
      </div>
    </footer>
  );
}
