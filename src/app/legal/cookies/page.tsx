import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Política de cookies y tecnologías de medición de alexendros.dev",
};

export default function CookiesPage() {
  return (
    <div className="ak-container">
      <section className="ak-section">
        <h1 style={{ marginBottom: 16 }}>Política de cookies</h1>
        <p className="ak-byline-sub mono" style={{ marginBottom: 32 }}>
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <article style={{ maxWidth: "72ch", lineHeight: 1.7 }}>
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>1. Qué son las cookies</h2>
            <p>
              Las cookies son pequeños ficheros que un sitio web instala en el navegador para
              recordar información entre visitas: preferencias, sesiones o datos estadísticos.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>2. Cookies utilizadas en este sitio</h2>
            <p>
              <strong>
                Este sitio no utiliza cookies propias ni de terceros con fines publicitarios, de
                seguimiento o de creación de perfiles.
              </strong>{" "}
              La navegación por <code>{SITE.url}</code> no instala cookies no esenciales.
            </p>
            <p>
              La medición de audiencia se realiza con Vercel Analytics y Vercel Speed Insights,
              servicios que funcionan sin cookies y sin identificadores persistentes: recopilan
              métricas agregadas y anónimas (páginas vistas, tiempos de carga) que no permiten
              identificar a ninguna persona.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>3. Cookies de terceros en procesos de pago</h2>
            <p>
              Al completar un pago, el navegador accede a la pasarela de Stripe, que puede emplear
              cookies estrictamente necesarias para la seguridad de la transacción y la prevención
              del fraude. Estas cookies las gestiona Stripe bajo su propia política y solo se usan
              durante el proceso de pago.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>4. Almacenamiento local del navegador</h2>
            <p>
              Algunas preferencias de interfaz (por ejemplo, pasos de un formulario en curso) pueden
              guardarse temporalmente en el almacenamiento local del propio navegador. Esta
              información no sale del dispositivo del usuario y puede borrarse en cualquier momento
              desde la configuración del navegador.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>5. Gestión y desactivación</h2>
            <p>
              Cualquier navegador permite consultar, bloquear o eliminar cookies desde sus ajustes
              de privacidad. Dado que este sitio no depende de cookies no esenciales, su
              funcionamiento no se ve afectado al desactivarlas.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>6. Cambios en esta política</h2>
            <p>
              Si en el futuro se incorporan cookies adicionales (por ejemplo, una herramienta de
              analítica que las utilice), esta página se actualizará y, cuando la normativa lo exija,
              se solicitará el consentimiento previo antes de instalarlas.
            </p>
            <p>
              Para cualquier duda: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. El tratamiento
              de datos personales asociado se describe en la{" "}
              <Link href="/legal/privacidad">Política de privacidad</Link>.
            </p>
          </section>
        </article>

        <nav style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/legal/privacidad" className="ak-btn ak-btn-secondary">
            Privacidad
          </Link>
          <Link href="/legal/condiciones" className="ak-btn ak-btn-secondary">
            Condiciones
          </Link>
          <Link href="/" className="ak-btn ak-btn-secondary">
            Volver al inicio
          </Link>
        </nav>
      </section>
    </div>
  );
}
