import type { NavLink } from "./types";

export const SITE = {
  name: "Alejandro Domingo Agustí",
  role: "Software & Platform Engineer",
  domain: "alexendros.pro",
  url: "https://alexendros.pro",
  email: "contacto@alexendros.pro",
  socials: {
    github: "https://github.com/Alexendros",
    // TODO: confirmar la URL real de LinkedIn (placeholder).
    linkedin: "https://www.linkedin.com/in/alexendros",
  },
} as const;

export const NAV: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Stack", href: "/stack" },
  { label: "Blog", href: "/blog" },
  { label: "Servicios", href: "/servicios" },
  { label: "Escaparate", href: "/escaparate" },
];

export const TECH = [
  "Rust", "Python", "TypeScript", "Next.js", "React", "Bash",
  "Docker", "Vault", "OpenTelemetry", "MCP", "GitHub Actions", "JSON Schema",
];
