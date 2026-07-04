// Fixtures tipadas para tests de lógica pura (p. ej. generadores JSON-LD), con
// las variantes de campos opcionales que conviene ejercer explícitamente.
import type { Post, Project } from "@/lib/content/types";

/** Post con `metaDescription` (debe primar sobre `desc` en BlogPosting). */
export const postConMeta: Post = {
  id: "post-demo",
  title: "Post de demostración",
  tag: "Calidad",
  date: "01 Ene 2026",
  read: "5 min",
  desc: "Descripción larga.",
  metaDescription: "Meta descripción corta.",
};

/** Post sin meta ni desc: el generador debe construir un fallback. */
export const postSinMeta: Post = {
  id: "post-minimo",
  title: "Post mínimo",
  tag: "DevTools",
  date: "02 Ene 2026",
  read: "3 min",
};

/** Proyecto con repo público y liveUrl: ejercita `codeRepository` y `url`. */
export const proyectoConRepo: Project = {
  id: "demo-repo",
  title: "Proyecto con repo",
  category: "Open Source",
  kind: "Open Source",
  year: "2026",
  h: 200,
  tags: ["Rust", "CLI"],
  desc: "Proyecto open source de ejemplo.",
  repoUrl: "https://github.com/Alexendros/plantillas",
  liveUrl: "https://demo.alexendros.dev",
  metrics: [{ v: "v1.0.0", l: "MIT" }],
};

/** Proyecto sin repo ni liveUrl: `url` cae al canónico /proyectos/<id>. */
export const proyectoSinRepo: Project = {
  id: "demo-privado",
  title: "Proyecto privado",
  category: "Web",
  kind: "Web App",
  year: "2025",
  h: 180,
  tags: ["Next.js"],
  desc: "Proyecto sin repositorio público.",
  metrics: [{ v: "100%", l: "carga instantánea" }],
};

/** Payload de contacto válido (base reutilizable en tests de integración). */
export const contactoValido = {
  name: "Ana Pruebas",
  email: "ana@example.com",
  type: "Web App",
  message: "Quiero una plataforma interna.",
  consent: true as const,
  website: "",
};
