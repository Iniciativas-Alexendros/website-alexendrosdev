import type { Principle, Stat, TimelineEntry } from "./types";

// Stats orientadas a valor/output (no a años): la huella pública es reciente.
export const HERO_STATS: Stat[] = [
  ["5", "proyectos OSS"],
  ["4", "lenguajes"], // Rust · Python · TypeScript · Bash
  ["3", "licencias OSS"], // AGPL-3.0 · MIT · CC BY 4.0
  ["100%", "código auditable"],
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
      "Tooling para desarrolladores y web fullstack: ecosistema de plantillas para Claude Code y portales en Next.js con backend propio.",
    ],
    tags: ["Rust", "Python", "TypeScript", "Seguridad", "MCP"],
  },
  {
    year: "Hasta 2026",
    role: "Desarrollo, seguridad y autoformación",
    org: "Proyectos propios y aprendizaje continuo",
    bullets: [
      "Base técnica en seguridad, sistemas (Rust) y automatización (Python), volcada en proyectos open source públicos.",
      "Detalle de experiencia, referencias y CV disponibles bajo petición.",
    ],
    tags: ["Seguridad", "Rust", "Python", "Open Source"],
  },
  // TODO: si procede, detallar empleos/clientes anteriores con rol, empresa, fechas y logros reales.
];

export const PRINCIPLES: Principle[] = [
  {
    icon: "shield",
    title: "Honestidad y precio cerrado",
    body: "Alcance claro y precio cerrado antes de empezar. Los cambios pequeños van incluidos; los grandes se hablan y se acuerdan. Sin sorpresas en la factura final.",
  },
  {
    icon: "check",
    title: "Calidad y verificación",
    body: "Nada se entrega sin verde: CI, tests y validadores en modo estricto. Verificar antes de modificar — la filosofía check-only de XEK aplicada a todo lo que construyo.",
  },
  {
    icon: "git-branch",
    title: "Open source y tuyo",
    body: "Trabajo con software libre siempre que puedo y el cliente es dueño de su código e infraestructura: sin lock-in, documentado y reproducible para que tu equipo lo mantenga.",
  },
];

export const DAILY_STACK = [
  "Rust", "Python", "TypeScript", "Next.js", "React", "Bash",
  "Docker", "HashiCorp Vault", "OpenTelemetry", "SigNoz", "PostgreSQL",
  "MCP", "Claude Code", "GitHub Actions", "JSON Schema", "Tailwind", "Vercel",
];
