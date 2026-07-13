import type { NavLink } from "./types";

export const SITE = {
  name: "Alejandro Domingo Agustí",
  role: "Desarrollo de plataformas, webs y aplicaciones",
  domain: "alexendros.dev",
  url: "https://alexendros.dev",
  email: "contacto@alexendros.dev",
  socials: {
    github: "https://github.com/Alexendros",
    linkedin: "https://www.linkedin.com/in/alexendros/",
    web: "https://alexendros.me",
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
  "TypeScript", "Next.js", "React", "Node.js", "Python", "Tailwind",
  "Docker", "Vercel", "Rust", "Supabase", "GitHub Actions", "OpenTelemetry",
];
