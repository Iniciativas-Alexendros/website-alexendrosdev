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
  /** URL de calendario para reservar llamada (Cal.com / Calendly). */
  bookingUrl: "https://cal.com/alexendros/30min",
} as const;

export const NAV: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Stack", href: "/stack" },
  { label: "Servicios", href: "/servicios" },
];

export const TECH = [
  "TypeScript", "Next.js", "React", "Node.js", "Python", "Tailwind",
  "Docker", "Vercel", "Rust", "Supabase", "GitHub Actions", "OpenTelemetry",
];
