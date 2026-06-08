import type { Principle, Stat, TimelineEntry } from "./types";

// Stats: factuales donde se puede deducir de los repos públicos; las inciertas
// (años de experiencia, nº de clientes) quedan como TODO para el usuario.
export const HERO_STATS: Stat[] = [
  ["5", "proyectos OSS"], // TODO: ajustar si se cuentan privados/otros
  ["4", "lenguajes"], // Rust · Python · TypeScript · Bash
  ["3", "licencias OSS"], // AGPL-3.0 · MIT · CC BY 4.0
  ["1", "objetivo: tu sistema"], // TODO: reemplplazar por años de experiencia / clientes reales
];

export const ABOUT_STATS: Stat[] = HERO_STATS;

export const TIMELINE: TimelineEntry[] = [
  {
    year: "2026 — Hoy",
    role: "Contratista independiente · Software & Platform Engineer",
    org: "Iniciativas Alexendros · Valencia, España",
    now: true,
    bullets: [
      "Diseño y construyo herramientas de seguridad e infraestructura: TrenchPass (gateway MCP de credenciales en Rust) y XEK (40+ skills de verificación check-only).",
      "Tooling para desarrolladores y automatización: ecosistema de plantillas `claude-init`-ready para Claude Code y portales web fullstack en Next.js.",
    ],
    tags: ["Rust", "Python", "TypeScript", "MCP", "Seguridad"],
  },
  // TODO: añadir el historial laboral previo real (rol, empresa, periodo, logros).
  {
    year: "TODO — TODO",
    role: "TODO: rol anterior",
    org: "TODO: empresa · ubicación",
    bullets: [
      "TODO: principal logro o responsabilidad de esta etapa.",
      "TODO: segundo logro medible (impacto, escala, tecnología).",
    ],
    tags: ["TODO"],
  },
];

export const PRINCIPLES: Principle[] = [
  {
    icon: "shield",
    title: "Verificar antes de modificar",
    body: "Primero medir y razonar, después actuar. Las herramientas auditan y proponen; la acción correctiva es una decisión consciente, nunca un efecto colateral. Es la filosofía de XEK aplicada a todo.",
  },
  {
    icon: "lock",
    title: "Custodia de secretos por diseño",
    body: "Las credenciales no se esparcen por mil servicios: viven tras un único custodio con doble factor y auditoría append-only. Si no queda registro, no ha pasado.",
  },
  {
    icon: "eye-off",
    title: "Sin tracking, con transparencia",
    body: "Lo personal sin analítica ni cookies de terceros; lo público, abierto y verificable (datos, licencias y registros como GV.ERRA). La confianza se construye enseñando el trabajo, no escondiéndolo.",
  },
];

export const DAILY_STACK = [
  "Rust", "Python", "TypeScript", "Next.js", "React", "Bash",
  "Docker", "HashiCorp Vault", "OpenTelemetry", "SigNoz", "PostgreSQL",
  "MCP", "Claude Code", "GitHub Actions", "JSON Schema", "Tailwind", "Vercel",
];
