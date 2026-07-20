import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description:
    "La página que buscas no existe. Puedes volver al inicio, ver proyectos o contactar conmigo.",
  robots: "noindex",
};

export default function NotFound() {
  return (
    <section
      className="ak-container ak-hero-c"
      data-screen-label="404"
      style={{ minHeight: "60vh" }}
    >
      <span className="ak-note">
        <Icon name="alert-circle" size={14} />
        Error 404
      </span>
      <h1 className="ak-display">Página no encontrada</h1>
      <p className="ak-hero-c-lead">
        La página que buscas no existe o ha cambiado de dirección. Si crees que debería estar aquí,
        escríbeme y lo reviso.
      </p>
      <div className="ak-hero-c-cta">
        <Button variant="primary" href="/">
          Volver al inicio
        </Button>
        <Button variant="secondary" href="/contacto">
          <Icon name="mail" size={16} style={{ marginRight: 8 }} />
          Contactar
        </Button>
      </div>
    </section>
  );
}
