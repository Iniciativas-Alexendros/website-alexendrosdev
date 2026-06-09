import type { Post } from "./types";

// Posts derivados de proyectos reales. Los cuerpos viven en content/blog/<id>.mdx.
// Son borradores iniciales (v1); ampliar/actualizar cuando proceda.
export const POSTS: Post[] = [
  {
    id: "trenchpass-mcp-gateway",
    title: "Un único custodio de credenciales: gateway MCP en Rust",
    tag: "Seguridad",
    date: "28 May 2026",
    read: "9 min",
    featured: true,
    desc: "Por qué junté ~20 secretos de proveedor detrás de un solo endpoint MCP con doble factor (Bearer + mTLS), auditoría append-only y observabilidad con SigNoz. La historia de TrenchPass.",
  },
  {
    id: "xek-verificacion-componible",
    title: "Verificación de seguridad componible: el enfoque de XEK",
    tag: "Seguridad",
    date: "14 May 2026",
    read: "8 min",
    desc: "40+ skills check-only que verifican y razonan, no modifican. Ejecución trifásica (dry-run → sandbox → real) y dialéctica tesis → antítesis → síntesis sobre repos, apps y hosts.",
  },
  {
    id: "plantillas-claude-init",
    title: "Plantillas claude-init-ready para Claude Code",
    tag: "DevTools",
    date: "30 Abr 2026",
    read: "7 min",
    desc: "Un ecosistema de plantillas para construir agentes, skills, comandos, hooks, plugins y servidores MCP sin empezar de cero, con validadores automáticos y CI.",
  },
];

export const BLOG_TAGS = ["Todos", "Seguridad", "DevTools", "Rust", "Open Source"];

export function getPost(id: string): Post | undefined {
  return POSTS.find((p) => p.id === id);
}
