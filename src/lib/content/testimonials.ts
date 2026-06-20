import type { Testimonial } from "./types";

// "Prueba en abierto": sin testimonios fabricados. En su lugar, enlaces a
// trabajo real y verificable (código y proyectos públicos). La sección de la
// home se renderiza mientras haya al menos una entrada (ver `src/app/page.tsx`).
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Gateway MCP en Rust: custodia de credenciales con doble factor Bearer+mTLS, auditoría append-only en Postgres y telemetría OTLP. Código abierto bajo AGPL.",
    name: "TrenchPass",
    role: "Rust · open source",
    url: "https://github.com/Alexendros/trenchpass",
  },
  {
    quote:
      "Ecosistema de plantillas modulares `claude-init`-ready para agentes, skills, comandos, hooks, plugins y servidores MCP, con validador `--strict` y CI.",
    name: "plantillas",
    role: "Python · open source",
    url: "https://github.com/Alexendros/plantillas",
  },
  {
    quote:
      "Sitio personal en Next.js (export estático), rápido y sin rastreo ni cookies de terceros. Tokens de diseño propios, oklch dark-first.",
    name: "alexendros.me",
    role: "Next.js · en producción",
    url: "https://alexendros.me",
  },
  {
    quote:
      "Este mismo portfolio: Next.js 16 (App Router) con backend propio (Route Handlers, zod, Prisma/Postgres, Stripe) y tests con gate de cobertura. Código público.",
    name: "Este portfolio",
    role: "Next.js + backend · open source",
    url: "https://github.com/Alexendros/website-alexendrosdev",
  },
];
