import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Condiciones de contratación",
  description:
    "Condiciones de contratación de los servicios de desarrollo y los productos digitales de alexendros.dev",
};

// TODO(operador): sustituir «__PENDIENTE_NIF__» por el NIF antes de considerar
// esta página jurídicamente completa (arts. 10 y 27 LSSI; art. 60 y 97-108
// TRLGDCU — Real Decreto Legislativo 1/2007).

export default function CondicionesPage() {
  return (
    <div className="ak-container">
      <section className="ak-section">
        <h1 style={{ marginBottom: 16 }}>Condiciones de contratación</h1>
        <p className="ak-byline-sub mono" style={{ marginBottom: 32 }}>
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <article className="ak-prose" style={{ maxWidth: "72ch", lineHeight: 1.7 }}>
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>1. Identificación del prestador</h2>
            <dl style={{ marginLeft: 16 }}>
              <dt style={{ fontWeight: 600 }}>Titular:</dt>
              <dd>Alejandro Domingo Agustí (Alexendros)</dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>NIF:</dt>
              <dd>__PENDIENTE_NIF__</dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>Domicilio profesional:</dt>
              <dd>Valencia, España</dd>
              <dt style={{ fontWeight: 600, marginTop: 12 }}>Contacto:</dt>
              <dd>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </dd>
            </dl>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>2. Objeto y ámbito</h2>
            <p>
              Las presentes condiciones regulan la contratación de servicios de desarrollo de
              software, sitios web y aplicaciones, así como la compra de servicios puntuales y
              productos digitales ofrecidos a través de <code>{SITE.url}</code> (en adelante,
              &ldquo;el Sitio&rdquo;). Completar un proceso de compra o aceptar un presupuesto
              implica la aceptación íntegra de estas condiciones.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>3. Precios y presupuestos</h2>
            <p>
              Los precios publicados como &ldquo;desde&rdquo; son orientativos y no constituyen
              oferta vinculante: cada proyecto se presupuesta por escrito antes de su inicio. Los
              servicios puntuales marcados con precio cerrado se contratan al importe indicado en el
              momento de la compra.
            </p>
            <p>
              Salvo indicación expresa en contrario, los importes no incluyen IVA, que se añadirá en
              factura con el tipo aplicable según la normativa vigente. El presupuesto aceptado y la
              factura emitida prevalecen sobre cualquier importe orientativo publicado en el Sitio.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>4. Proceso de contratación</h2>
            <p>
              La contratación de proyectos a medida sigue, con carácter general, estas fases:
              solicitud y análisis de necesidades, presupuesto por escrito, aceptación expresa del
              presupuesto por el cliente, desarrollo con entregas parciales acordadas, y entrega
              final con su período de soporte según lo contratado.
            </p>
            <p>
              Los servicios puntuales de precio cerrado se perfeccionan en el momento en que el pago
              se confirma a través de la pasarela habilitada (Stripe) o, en su caso, mediante
              transferencia bancaria según las instrucciones facilitadas.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>5. Formas de pago y facturación</h2>
            <p>
              El pago con tarjeta se procesa a través de Stripe, Inc.; los datos de la tarjeta no
              pasan por los servidores del Sitio. También se admite transferencia bancaria cuando se
              ofrece expresamente. Por cada compra se emite la factura correspondiente y se remite
              al correo electrónico indicado por el cliente.
            </p>
            <p>
              En proyectos a medida, el calendario de pagos (anticipo, hitos y liquidación) se fija
              en el presupuesto aceptado. La falta de pago en plazo faculta a suspender los trabajos
              hasta su regularización.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>6. Derecho de desistimiento</h2>
            <p>
              Si el cliente actúa como consumidor y usuario, dispone de un plazo de 14 días
              naturales desde la celebración del contrato para desistir sin necesidad de
              justificación, de acuerdo con los artículos 102 y siguientes del Real Decreto
              Legislativo 1/2007 (TRLGDCU).
            </p>
            <p>
              De conformidad con el artículo 103.a TRLGDCU, si el cliente solicita expresamente que
              la ejecución del servicio comience durante el plazo de desistimiento y este se ejecuta
              por completo con su consentimiento, perderá su derecho de desistimiento. Si desiste
              habiéndose iniciado la ejecución a su petición expresa, abonará la parte proporcional
              a lo efectivamente prestado hasta ese momento.
            </p>
            <p>
              Para ejercer el desistimiento basta con comunicarlo por escrito a{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> indicando el servicio contratado y
              la referencia del pago. El reembolso se realizará por el mismo medio de pago en un
              plazo máximo de 14 días naturales desde la recepción de la comunicación.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>7. Conformidad, garantía y soporte</h2>
            <p>
              Los servicios se prestan con la diligencia debida y de acuerdo con el presupuesto
              aceptado. Cada entrega incluye un período de soporte y corrección de defectos de
              conformidad según lo contratado (30, 60 días o el plazo acordado), computado desde la
              entrega.
            </p>
            <p>
              Quedan fuera de la garantía los defectos derivados de modificaciones realizadas por el
              cliente o terceros, de usos no contemplados en el presupuesto o de incidencias en
              servicios de terceros ajenos al control del prestador (hosting, pasarelas, APIs
              externas).
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>8. Propiedad intelectual</h2>
            <p>
              Salvo pacto expreso en contrario, una vez abonado íntegramente el proyecto, el cliente
              adquiere los derechos de explotación sobre el desarrollo específico realizado para él.
              El prestador conserva la titularidad de sus herramientas, librerías, plantillas y
              metodologías propias de carácter general reutilizables, así como el derecho a citar el
              proyecto como referencia profesional, salvo acuerdo de confidencialidad.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>9. Responsabilidad y disponibilidad</h2>
            <p>
              El prestador no responde de interrupciones o incidencias imputables a terceros
              (proveedores de hosting, pasarelas de pago, redes de distribución) ni de las
              consecuencias de un uso del entregable distinto al previsto en el presupuesto. La
              responsabilidad total del prestador queda limitada, en cualquier caso, al importe
              abonado por el servicio que origine la reclamación.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>10. Resolución de litigios</h2>
            <p>
              Las partes intentarán resolver cualquier discrepancia de manera amistosa. El
              consumidor puede dirigirse además al sistema arbitral de consumo de su comunidad
              autónoma. Para lo no resuelto, serán competentes los Juzgados y Tribunales que
              determine la normativa aplicable, con sumisión preferente a los de Valencia, España,
              cuando el cliente no actúe como consumidor.
            </p>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>11. Legislación aplicable</h2>
            <p>
              Estas condiciones se rigen por la legislación española, en particular la Ley 34/2002
              (LSSI), el Real Decreto Legislativo 1/2007 (TRLGDCU) y la normativa de protección de
              datos aplicable, descrita en la{" "}
              <Link href="/legal/privacidad">Política de privacidad</Link>.
            </p>
          </section>
        </article>

        <nav style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/legal/privacidad" className="ak-btn ak-btn-secondary">
            Privacidad
          </Link>
          <Link href="/legal/aviso-legal" className="ak-btn ak-btn-secondary">
            Aviso legal
          </Link>
          <Link href="/" className="ak-btn ak-btn-secondary">
            Volver al inicio
          </Link>
        </nav>
      </section>
    </div>
  );
}
