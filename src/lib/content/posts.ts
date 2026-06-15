import type { Post } from "./types";

// Posts derivados de proyectos reales. Los cuerpos viven en content/blog/<id>.mdx.
// Son borradores iniciales (v1); ampliar/actualizar cuando proceda.
export const POSTS: Post[] = [
  {
    id: "plantillas-claude-init",
    title: "Plantillas claude-init-ready para Claude Code",
    tag: "DevTools",
    date: "30 Abr 2026",
    read: "7 min",
    featured: true,
    desc: "Un ecosistema de plantillas para construir agentes, herramientas y servidores sin empezar de cero, con comprobaciones automáticas y despliegue continuo.",
  },
  {
    id: "trenchpass-mcp-gateway",
    title: "Un único custodio para todas tus credenciales: TrenchPass en Rust",
    tag: "Plataforma",
    date: "28 May 2026",
    read: "9 min",
    desc: "Por qué reuní las credenciales de ~20 servicios externos detrás de una sola puerta de entrada, con registro de cada acceso y monitorización. La historia de TrenchPass.",
  },
  {
    id: "xek-verificacion-componible",
    title: "Verificar sin modificar: el enfoque de XEK",
    tag: "Calidad",
    date: "14 May 2026",
    read: "8 min",
    desc: "Más de 40 comprobaciones automáticas que revisan calidad y seguridad e informan, sin modificar nada. De la prueba en seco a la real, sobre proyectos, aplicaciones y servidores.",
  },
];

export const BLOG_TAGS = ["Todos", "Plataforma", "DevTools", "Calidad", "Rust", "Open Source"];

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}
