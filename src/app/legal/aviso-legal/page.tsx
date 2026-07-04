import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Información legal del responsable de alexendros.dev",
};

export default function AvisoLegalPage() {
  return (
    <div className="ak-container">
      <section className="ak-section">
        <h1 style={{ marginBottom: 16 }}>Aviso legal</h1>
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
            <h2 style={{ marginBottom: 12 }}>1. Datos del responsable</h2>
            <dl style={{ marginLeft: 16 }}>
              <dt style={{ fontWeight: 600 }}>Nombre comercial:</dt>
              <dd>Alejandro Domingo Agustí (Alexendros)</dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>Domicilio profesional:</dt>
              <dd>Valencia, España</dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>Email de contacto:</dt>
              <dd>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>Sitio web:</dt>
              <dd>
                <a href={SITE.url}>{SITE.url}</a>
              </dd>
            </dl>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>2. Objeto</h2>
            <p>
              El presente aviso legal regula el acceso y uso del sitio web <code>{SITE.url}</code>{" "}
              (en adelante, &ldquo;el Sitio&rdquo;), del que es titular el Responsable. El acceso al
              Sitio implica la aceptación sin reservas de las presentes condiciones.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>3. Propiedad intelectual e industrial</h2>
            <p>
              Todos los contenidos del Sitio (textos, imágenes, código, diseño, estructura, marcas,
              logotipos) son propiedad del Responsable o de terceros que han autorizado su uso, y
              están protegidos por la normativa de propiedad intelectual e industrial.
            </p>
            <p>
              Queda prohibida la reproducción, distribución, comunicación pública, transformación o
              cualquier otro acto de explotación sin autorización expresa y por escrito.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>4. Responsabilidad</h2>
            <p>
              El Responsable no garantiza la disponibilidad y continuidad del funcionamiento del
              Sitio, ni que este sea útil para la realización de una actividad en particular. El
              Responsable no se hace responsable de los daños que puedan derivarse de la falta de
              disponibilidad o de errores en el acceso.
            </p>
            <p>
              Los enlaces a sitios de terceros se proporcionan únicamente a título informativo. El
              Responsable no controla ni es responsable del contenido de dichos sitios.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>5. Protección de datos personales</h2>
            <p>
              El tratamiento de datos personales se rige por la{" "}
              <Link href="/legal/privacidad">Política de privacidad</Link>, que forma parte
              integrante de este aviso legal.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>6. Legislación aplicable y jurisdicción</h2>
            <p>
              Las presentes condiciones se rigen por la legislación española. Para la resolución de
              cualquier controversia que pudiera surgir, ambas partes se someten a los Juzgados y
              Tribunales de Valencia, España, salvo que la normativa aplicable establezca otro
              fuero.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>7. Contacto</h2>
            <p>
              Para cualquier consulta sobre este aviso legal, puedes contactar en{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </p>
          </section>
        </article>

        <nav style={{ marginTop: 32 }}>
          <Link href="/" className="ak-btn ak-btn-secondary">
            Volver al inicio
          </Link>
        </nav>
      </section>
    </div>
  );
}
