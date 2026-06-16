import type { Project } from "./types";

// Proyectos públicos reales (github.com/Alexendros). Las métricas factuales
// (licencia, versión, nº de módulos/skills) salen de cada README; las marcadas
// con `TODO:` necesitan datos que aún no son públicos (stars, usuarios, adopción).
export const PROJECTS: Project[] = [
  {
    id: "alexendros-me",
    title: "alexendros.me — Sitio personal",
    category: "Web",
    kind: "Web App",
    year: "2026",
    h: 185,
    featured: true,
    image: "/proyectos/alexendros-me.png",
    tags: ["Next.js", "React", "TypeScript", "Tailwind", "Vercel"],
    desc: "Sitio web para publicar ideas, rápido y respetuoso con la privacidad: sin rastreo ni cookies de terceros. Construido con Next.js y React, con tipografía propia y servido desde la red global de Vercel para que cargue al instante.",
    metaDescription: "Sitio personal en Next.js sin rastreo ni cookies. Rápido, privado y construido con React, Tailwind y Vercel.",
    liveUrl: "https://alexendros.dev",
    metrics: [
      { v: "0", l: "rastreadores / cookies", acc: true },
      { v: "Next.js", l: "React + Tailwind" },
      { v: "100%", l: "carga instantánea" },
    ],
  },
  {
    id: "trenchpass",
    title: "TrenchPass — Plataforma de acceso centralizado",
    category: "Plataforma / Backend",
    kind: "Plataforma",
    year: "2026",
    h: 240,
    featured: true,
    tags: ["Rust", "axum", "API", "PostgreSQL", "Docker", "OpenTelemetry"],
    desc: "Plataforma backend en Rust (axum) que centraliza el acceso a ~20 servicios externos (Notion, Stripe, GitHub, Vercel…) tras una única API: un punto de entrada fiable, con registro de cada acceso y monitorización integrada. Diseño de plataforma de principio a fin, pensado para crecer sin perder control.",
    metaDescription: "API gateway en Rust (axum) que centraliza ~20 servicios externos con registro de acceso y monitorización. AGPL-3.0.",
    metrics: [
      { v: "~20", l: "servicios integrados", acc: true },
      { v: "Rust", l: "axum + PostgreSQL" },
      { v: "AGPL-3.0", l: "open source" },
    ],
  },
  {
    id: "nasve",
    title: "Gráficas Nasve — Web y tienda para imprenta",
    category: "Web",
    kind: "Web App",
    year: "2026",
    h: 210,
    featured: true,
    image: "/proyectos/nasve.png",
    tags: ["Next.js", "React", "TypeScript", "E-commerce", "Vercel"],
    desc: "Sitio web y tienda para Gráficas Nasve, imprenta familiar de Torrent desde 1982: catálogo, configurador de encargos y solicitud de presupuesto, con un diseño a medida que transmite oficio y confianza. Proyecto de cliente, de la idea al lanzamiento.",
    metaDescription: "Web y tienda a medida para Gráficas Nasve (imprenta, Torrent 1982): catálogo, configurador de encargos y presupuesto.",
    metrics: [
      { v: "Web + tienda", l: "diseño y desarrollo", acc: true },
      { v: "Next.js", l: "React + TypeScript" },
      { v: "2026", l: "proyecto de cliente" },
    ],
  },
  {
    id: "plantillas",
    title: "Plantillas para Claude Code",
    category: "Developer Tooling",
    kind: "Open Source",
    year: "2026",
    h: 200,
    tags: ["Python", "Claude Code", "MCP", "GitHub Actions", "pre-commit"],
    desc: "Ecosistema de plantillas modulares `claude-init`-ready para construir agentes, skills, comandos, hooks, plugins, servidores MCP y repositorios GitHub profesionales. Cada módulo incluye plantilla, ejemplo funcional y validador automático con modo `--strict`.",
    metaDescription: "Plantillas modulares para Claude Code: agentes, skills, MCP, hooks y repos GitHub profesionales. 8 módulos validados. MIT.",
    metrics: [
      { v: "8/8", l: "módulos validados", acc: true },
      { v: "8", l: "tipos de módulo" },
      { v: "v1.0.0", l: "MIT" },
    ],
  },
  {
    id: "xek",
    title: "XEK — Verificación automática de calidad",
    category: "Herramientas / Automatización",
    kind: "Open Source",
    year: "2026",
    h: 225,
    tags: ["Bash", "Python", "Automatización", "CI", "Calidad"],
    desc: "Conjunto de más de 40 comprobaciones automáticas que revisan la calidad, la configuración y las buenas prácticas de seguridad de un proyecto, una aplicación en vivo o un servidor. Trabaja por fases con controles de promoción; solo revisa e informa, nunca modifica.",
    metaDescription: "40+ comprobaciones automáticas de calidad y seguridad en 3 fases. Solo revisa e informa, nunca modifica el proyecto. MIT.",
    metrics: [
      { v: "40+", l: "comprobaciones", acc: true },
      { v: "3 fases", l: "ejecución guiada" },
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
    metaDescription: "Registro público de errores en documentos oficiales de la Generalitat Valenciana. Metadatos estructurados y validación JSON Schema.",
    metrics: [
      { v: "CC BY 4.0", l: "contenido abierto", acc: true },
      { v: "JSON Schema", l: "validación automática" },
      { v: "draft-07", l: "esquema" },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
