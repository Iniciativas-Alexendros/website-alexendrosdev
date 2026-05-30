import type { NavLink } from "./types";

export const SITE = {
  name: "Alejandro Vargas",
  role: "Platform Engineer & Fullstack Developer",
  domain: "alexendros.dev",
  url: "https://alexendros.dev",
  email: "hola@alexendros.dev",
  socials: {
    github: "https://github.com/alejandrovargas",
    linkedin: "https://linkedin.com/in/alejandrovargas-dev",
    twitter: "https://twitter.com/alejandrovargas",
  },
} as const;

export const NAV: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Stack", href: "/stack" },
  { label: "Blog", href: "/blog" },
  { label: "Servicios", href: "/servicios" },
];

export const TECH = [
  "Go", "Kubernetes", "Terraform", "ArgoCD", "React", "Next.js",
  "TypeScript", "AWS", "PostgreSQL", "OpenTelemetry", "Grafana", "Docker",
];
