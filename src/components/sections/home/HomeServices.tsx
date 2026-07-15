"use client";

import Link from "next/link";
import { Icon, Button } from "@/components/ui";

interface Service {
  slug: string;
  name: string;
  description: string;
  price: string;
  features: string[];
}

const SERVICES: Service[] = [
  {
    slug: "landing",
    name: "Landing Page",
    description:
      "Página de venta/conversión optimizada: hero, beneficios, social proof, CTA. Entrega en 2 semanas.",
    price: "Desde 2.500 €",
    features: ["Diseño responsive", "SEO técnico", "Analytics", "Formularios"],
  },
  {
    slug: "web-app",
    name: "Web App / SaaS",
    description:
      "Aplicación completa con auth, dashboard, pagos, panel admin. Arquitectura escalable, tests, CI/CD.",
    price: "Desde 8.000 €",
    features: ["Auth (NextAuth)", "DB + Prisma", "Stripe Checkout", "Panel admin"],
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    description:
      "Tienda online con catálogo, carrito, checkout, pedidos, stock, emails, integración ERP/CRM opcional.",
    price: "Desde 6.000 €",
    features: ["Catálogo + filtros", "Stripe / Transferencia", "Panel pedidos", "Emails auto"],
  },
  {
    slug: "api",
    name: "API / Backend",
    description:
      "API REST/GraphQL documentada, autenticación, rate limiting, webhooks, deploy serverless o contenedores.",
    price: "Desde 3.500 €",
    features: ["OpenAPI/Swagger", "Auth JWT/OAuth", "Tests contrato", "Observabilidad"],
  },
  {
    slug: "migration",
    name: "Migración / Refactor",
    description:
      "Migra tu Legacy (WP, PHP, jQuery, etc.) a stack moderno. Preserva SEO, datos y funcionalidad.",
    price: "A consultar",
    features: ["Auditoría inicial", "Migración por fases", "Cero downtime", "Tests regresión"],
  },
];

export function HomeServices() {
  return (
    <section className="ak-section" aria-labelledby="services-heading">
      <div className="ak-container">
        <header className="ak-section-head ak-center">
          <h2 id="services-heading" className="ak-h2">
            Servicios
          </h2>
          <p className="ak-section-sub">
            Cinco formas de trabajar juntos. Precios transparentes, código tuyo, sin ataduras.
          </p>
        </header>

        <div className="ak-srv-list" role="list">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios#${service.slug}`}
              className="ak-srv-row"
              role="listitem"
            >
              <div className="ak-srv-main">
                <h3 className="ak-srv-name">{service.name}</h3>
                <p className="ak-srv-sub">{service.description}</p>
              </div>
              <span className="ak-srv-price">{service.price}</span>
              <button
                type="button"
                className="ak-srv-arrow"
                aria-label={`Ver detalles de ${service.name}`}
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Button variant="secondary" size="lg" href="/servicios">
            Ver todos los servicios <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}
