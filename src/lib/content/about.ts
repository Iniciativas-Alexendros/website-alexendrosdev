import type { Principle, Stat, TimelineEntry } from "./types";

// Stats orientadas a valor/output (no a años): la huella pública es reciente.
export const HERO_STATS: Stat[] = [
  ["5", "proyectos publicados"],
  ["4", "lenguajes"], // TypeScript · Python · Rust · Bash
  ["100%", "código tuyo"],
  ["0", "ataduras"],
];

export const ABOUT_STATS: Stat[] = HERO_STATS;

export const TIMELINE: TimelineEntry[] = [
  {
    year: "2026 — Hoy",
    role: "Desarrollador independiente · plataformas, webs y aplicaciones",
    org: "Iniciativas Alexendros · Valencia, España",
    now: true,
    bullets: [
      "Diseño y desarrollo webs, aplicaciones y plataformas a medida para negocios, con tecnología moderna (Next.js, React, TypeScript) y backend propio.",
      "También creo herramientas internas y automatizaciones para equipos, y publico proyectos open source de ingeniería como TrenchPass (Rust) y XEK.",
    ],
    tags: ["TypeScript", "Next.js", "React", "Plataformas", "Rust"],
  },
  {
    year: "Hasta 2026",
    role: "Desarrollo y formación continua",
    org: "Proyectos propios y aprendizaje continuo",
    bullets: [
      "Base técnica sólida en desarrollo, sistemas (Rust) y automatización (Python), volcada en proyectos open source públicos.",
      "Detalle de experiencia, referencias y CV disponibles bajo petición.",
    ],
    tags: ["Desarrollo", "Rust", "Python", "Open Source"],
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
    title: "Calidad de verdad",
    body: "Nada se entrega sin pasar los controles: pruebas automáticas y revisión antes de cada entrega. Reviso y verifico antes de dar nada por terminado, para que lo que recibes funcione.",
  },
  {
    icon: "git-branch",
    title: "Open source y tuyo",
    body: "Trabajo con software libre siempre que puedo y el cliente es dueño de su código e infraestructura: sin lock-in, documentado y reproducible para que tu equipo lo mantenga.",
  },
];

export const DAILY_STACK = [
  "TypeScript", "Next.js", "React", "Node.js", "Python", "PostgreSQL",
  "Tailwind", "Docker", "Vercel", "GitHub Actions", "Rust", "Bash",
  "OpenTelemetry", "Claude Code",
];
