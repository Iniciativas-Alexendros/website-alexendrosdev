// Fixtures tipadas para tests de lógica pura (p. ej. generadores JSON-LD), con
// las variantes de campos opcionales que conviene ejercer explícitamente.
import type { Project } from "@/lib/content/types";

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
