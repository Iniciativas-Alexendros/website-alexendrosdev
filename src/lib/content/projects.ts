import type { Project } from "./types";

// Proyectos públicos reales (github.com/Alexendros). Las métricas factuales
// (licencia, versión, nº de módulos/skills) salen de cada README; las marcadas
// con `TODO:` necesitan datos que aún no son públicos (stars, usuarios, adopción).
export const PROJECTS: Project[] = [
  {
    id: "trenchpass",
    title: "TrenchPass — MCP Secrets Gateway",
    category: "Seguridad / Plataforma",
    kind: "Infra",
    year: "2026",
    h: 240,
    featured: true,
    tags: ["Rust", "axum", "MCP", "HashiCorp Vault", "mTLS", "OpenTelemetry"],
    desc: "Gateway MCP que centraliza ~20 secretos de proveedor (Notion, Stripe, GitHub, Vercel, Dokploy…) tras un único endpoint con doble factor (Bearer + mTLS), log de auditoría append-only y observabilidad con OpenTelemetry → SigNoz. Custodio único de credenciales para el ecosistema Alexendros.",
    metrics: [
      { v: "2FA", l: "Bearer + mTLS", acc: true },
      { v: "~20", l: "secretos centralizados" },
      { v: "AGPL-3.0", l: "open source" },
    ],
  },
  {
    id: "plantillas",
    title: "Plantillas para Claude Code",
    category: "Developer Tooling",
    kind: "Open Source",
    year: "2026",
    h: 200,
    featured: true,
    tags: ["Python", "Claude Code", "MCP", "GitHub Actions", "pre-commit"],
    desc: "Ecosistema de plantillas modulares `claude-init`-ready para construir agentes, skills, comandos, hooks, plugins, servidores MCP y repositorios GitHub profesionales. Cada módulo incluye plantilla, ejemplo funcional y validador automático con modo `--strict`.",
    metrics: [
      { v: "8/8", l: "módulos validados", acc: true },
      { v: "8", l: "tipos de módulo" },
      { v: "v1.0.0", l: "MIT" },
    ],
  },
  {
    id: "xek",
    title: "XEK — Clúster de verificación de seguridad",
    category: "Seguridad / Compliance",
    kind: "Open Source",
    year: "2026",
    h: 225,
    tags: ["Bash", "Python", "SAST/SCA/DAST", "IaC", "RGPD", "CI"],
    desc: "Clúster de 40+ skills de verificación (check-only) de seguridad, postura y compliance sobre repositorios, apps en vivo y hosts Linux. Ejecución trifásica (dry-run → sandbox → real) con gates de promoción; verifica y razona, no modifica: emite informe + propuesta.",
    metrics: [
      { v: "40+", l: "skills de verificación", acc: true },
      { v: "3 fases", l: "dry-run → sandbox → real" },
      { v: "v0.7.0", l: "MIT" },
    ],
  },
  {
    id: "gv-erra",
    title: "GV.ERRA — Registro de errores oficiales",
    category: "Datos abiertos / Cívico",
    kind: "Open Source",
    year: "2026",
    h: 195,
    tags: ["Python", "JSON Schema", "Transparencia", "Datos abiertos"],
    desc: "Registro público y verificable de errores detectados en documentos y sistemas oficiales de la Generalitat Valenciana y otros organismos. Cada entrada lleva metadatos estructurados, descripción técnica, solución aplicada y seguimiento de notificación a 30 días, con validación automática vía JSON Schema.",
    metrics: [
      { v: "CC BY 4.0", l: "contenido abierto", acc: true },
      { v: "JSON Schema", l: "validación automática" },
      { v: "draft-07", l: "esquema" },
    ],
  },
  {
    id: "alexendros-me",
    title: "alexendros.me — Sitio personal",
    category: "Web",
    kind: "Web App",
    year: "2026",
    h: 185,
    tags: ["Next.js 15", "React 19", "TypeScript", "Tailwind v4", "Vercel"],
    desc: "Espacio personal para publicar ideas sin ánimo de lucro, sin tracking, analítica ni cookies de terceros. Next.js 15 con App Router, tokens oklch dark-first, tipografía self-hosted y export estático servido desde el edge de Vercel.",
    metrics: [
      { v: "0", l: "trackers / cookies", acc: true },
      { v: "static", l: "export + CDN edge" },
      { v: "oklch", l: "tokens dark-first" },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
