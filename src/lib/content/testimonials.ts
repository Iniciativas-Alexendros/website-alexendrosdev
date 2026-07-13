import type { Testimonial } from "./types";

// ─── Testimonios y prueba social ──────────────────────────────────────────────
//
// Política: "prueba en abierto" — sin testimonios fabricados. Cada entrada
// apunta a trabajo real y verificable (código o proyectos en producción) o
// reservan una ranura explícita para declaraciones de clientes pendientes del
// operador.
//
// Tipos de entrada:
//   - `{ kind: "client" }`        — cita atribuida a un cliente real
//                                    (nombre + rol + enlace opcional al
//                                    proyecto).
//   - `{ kind: "work" }`          — pieza de trabajo propia verificable (repo
//                                    público o proyecto en producción).
//   - `{ kind: "solicitado" }`    — ranura pendiente; el operador sustituye
//                                    los tres campos marcados con
//                                    `__PENDIENTE__` cuando reciba una
//                                    declaración del cliente.
//
// Cuando el operador complete el campo TODO se elimina el prefijo
// `__PENDIENTE__:` y el tipo se cambia a `client`.
export const TESTIMONIALS: Testimonial[] = [
  // ─── Trabajo propio verificable ─────────────────────────────────────────
  {
    kind: "work",
    quote:
      "Sitio personal en Next.js (export estático), rápido y sin rastreo ni cookies de terceros. Tokens de diseño propios, oklch dark-first.",
    name: "alexendros.me",
    role: "Next.js · en producción",
    url: "https://alexendros.me",
  },
  {
    kind: "work",
    quote:
      "Este mismo portfolio: Next.js 16 (App Router) con backend propio (Route Handlers, zod, Prisma/Postgres, Stripe) y tests con gate de cobertura. Código público.",
    name: "Este portfolio",
    role: "Next.js + backend · open source",
    url: "https://github.com/Iniciativas-Alexendros/website-alexendrosdev",
  },

  // ─── Ranuras para declaraciones de clientes (operador) ──────────────────
  // Cuando el operador reciba una declaración real, sustituye `__PENDIENTE__:`
  // por la cita verbatim del cliente, completa `name` y `role`, y (si procede)
  // añade el `url` al proyecto o producto del cliente.
  //
  // Tres ranuras reservadas por defecto; pueden ampliarse. Las entradas con
  // prefijo `__PENDIENTE__:` NO se renderizan (ver Testimonials.tsx → filtra
  // por ausencia del prefijo).
  {
    kind: "solicitado",
    quote: "__PENDIENTE__: cita verbatim del cliente.",
    name: "__PENDIENTE__: nombre del cliente",
    role: "__PENDIENTE__: cargo o empresa",
  },
  {
    kind: "solicitado",
    quote: "__PENDIENTE__: cita verbatim del cliente.",
    name: "__PENDIENTE__: nombre del cliente",
    role: "__PENDIENTE__: cargo o empresa",
  },
  {
    kind: "solicitado",
    quote: "__PENDIENTE__: cita verbatim del cliente.",
    name: "__PENDIENTE__: nombre del cliente",
    role: "__PENDIENTE__: cargo o empresa",
  },
];
