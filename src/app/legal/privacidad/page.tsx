import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales en alexendros.dev",
};

export default function PrivacidadPage() {
  return (
    <div className="ak-container">
      <section className="ak-section">
        <h1 style={{ marginBottom: 16 }}>Política de privacidad</h1>
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
            <h2 style={{ marginBottom: 12 }}>1. Responsable del tratamiento</h2>
            <p>
              <strong>Alejandro Domingo Agustí</strong> (en adelante, &ldquo;el Responsable&rdquo;),
              con domicilio profesional en Valencia, España, y email de contacto:{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>2. Finalidades y base legal</h2>
            <dl style={{ marginLeft: 16 }}>
              <dt style={{ fontWeight: 600, marginTop: 16 }}>
                Gestión de contactos (formulario de contacto)
              </dt>
              <dd>
                Tratamos tu nombre, email, tipo de consulta y mensaje para responder a tu solicitud.
                Base legal: consentimiento (Art. 6.1.a RGPD) al enviar el formulario.
              </dd>

              <dt style={{ fontWeight: 600, marginTop: 16 }}>
                Suscripción a newsletter (double opt-in)
              </dt>
              <dd>
                Tratamos tu email para enviarte artículos sobre desarrollo web y productos
                digitales. Base legal: consentimiento explícito mediante doble confirmación (Art.
                6.1.a RGPD). El token de confirmación caduca a las 48 horas y es de un solo uso.
              </dd>

              <dt style={{ fontWeight: 600, marginTop: 16 }}>
                Procesamiento de pedidos (checkout)
              </dt>
              <dd>
                Tratamos tu email y datos de facturación necesarios para completar la compra y
                emitir el recibo correspondiente. Base legal: ejecución de contrato (Art. 6.1.b
                RGPD).
              </dd>
            </dl>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>3. Encargados de tratamiento (subprocesadores)</h2>
            <p>
              Los siguientes proveedores acceden a tus datos por cuenta del Responsable, bajo
              contrato de encargado de tratamiento (Art. 28 RGPD):
            </p>
            <ul style={{ marginLeft: 16, marginTop: 8 }}>
              <li>
                <strong>Supabase (PostgreSQL)</strong> — almacenamiento de leads, suscriptores y
                pedidos. Datos alojados en la UE (Frankfurt).
              </li>
              <li>
                <strong>Resend (envío de emails)</strong> — notificaciones de contacto y emails de
                confirmación de newsletter. Servidores en EE. UU. Transferencia bajo cláusulas
                contractuales tipo de la Comisión Europea (Decisión 2021/914).
              </li>
              <li>
                <strong>Stripe (procesamiento de pagos)</strong> — gestión de pagos con tarjeta.
                Servidores en EE. UU. Transferencia bajo cláusulas contractuales tipo de la Comisión
                Europea.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>4. Transferencias internacionales</h2>
            <p>
              Resend y Stripe procesan datos en Estados Unidos. Estas transferencias se amparan en
              cláusulas contractuales tipo aprobadas por la Comisión Europea, garantizando un nivel
              de protección esencialmente equivalente al de la UE.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>5. Plazos de conservación</h2>
            <ul style={{ marginLeft: 16 }}>
              <li>Leads de contacto sin conversión: 2 años desde la última interacción.</li>
              <li>
                Suscriptores de newsletter: hasta que solicites la baja (enlace en cada email).
              </li>
              <li>
                Datos de facturación y pedidos: 4 años (plazo fiscal Art. 66-70 LGT) o 6 años si
                aplica normativa contable.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>6. Tus derechos (ARCO-POL)</h2>
            <p>Puedes ejercer en cualquier momento:</p>
            <ul style={{ marginLeft: 16 }}>
              <li>
                <strong>Acceso</strong> — saber qué datos tuyos tratamos.
              </li>
              <li>
                <strong>Rectificación</strong> — corregir datos inexactos.
              </li>
              <li>
                <strong>Supresión</strong> — pedir que borremos tus datos (&ldquo;derecho al
                olvido&rdquo;).
              </li>
              <li>
                <strong>Oposición</strong> — opónte al tratamiento por interés legítimo.
              </li>
              <li>
                <strong>Portabilidad</strong> — recibir tus datos en formato estructurado.
              </li>
              <li>
                <strong>Limitación</strong> — restringir el tratamiento temporalmente.
              </li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Para ejercerlos, envía un email a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
              indicando el derecho que ejercitas. Responderemos en el plazo legal de un mes
              (prorrogable dos meses en casos complejos).
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>7. Cookies y tecnologías similares</h2>
            <p>
              Este sitio <strong>no utiliza cookies de rastreo ni publicidad</strong>. Vercel
              Analytics (si está activo) funciona sin cookies (cookie-less). El único almacenamiento
              local es una preferencia de tema (claro/oscuro) en <code>localStorage</code>, que no
              identifica al usuario.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>8. Reclamación ante autoridad de control</h2>
            <p>
              Si consideras que no hemos atendido correctamente tus derechos, puedes presentar
              reclamación ante la{" "}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                Agencia Española de Protección de Datos (AEPD)
              </a>
              .
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>9. Cambios en esta política</h2>
            <p>
              Cualquier modificación se publicará en esta página con la fecha de actualización
              correspondiente. Te recomendamos revisarla periódicamente.
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
