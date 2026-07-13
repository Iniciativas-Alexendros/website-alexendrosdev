import type { StackCategory, StackDetail } from "./types";

export const STACK_CATS: StackCategory[] = [
  { name: "Lenguajes", color: "var(--primary-400)", leaves: ["Rust", "Python", "TypeScript", "Bash", "CSS", "HTML"] },
  { name: "Web", color: "var(--success)", leaves: ["Next.js", "React", "Tailwind", "Node.js", "Astro"] },
  { name: "Infraestructura", color: "var(--warning)", leaves: ["Docker", "Supabase", "Vercel", "OpenTelemetry", "Coolify", "Cloudflare"] },
  { name: "Herramientas e IA", color: "var(--primary-600)", leaves: ["MCP", "OpenCode", "CommandCode", "GitHub Actions", "JSON Schema", "Notion", "GNU/Linux Ubuntu 26"] },
];

export const STACK_DETAIL: Record<string, StackDetail> = {
  Rust: { level: 0.82, projects: ["mcp-toolkit"], note: "Lenguaje elegido cuando hace falta máximo rendimiento y fiabilidad: servidores MCP rápidos y sin sorpresas en producción." },
  Python: { level: 0.9, projects: ["mcp-toolkit", "stripe-catalog"], note: "El caballo de batalla para tooling, validadores y automatización: prototipos rápidos y scripts de infraestructura." },
  TypeScript: { level: 0.88, projects: ["alexendros-me", "pipeline-crm", "stripe-catalog"], note: "Por defecto en todo el frontend y backend Node. Tipos estrictos como documentación ejecutable." },
  Bash: { level: 0.85, projects: ["alexendros-me"], note: "Automatización de infraestructura, scripts de despliegue y herramientas de verificación en cualquier host Linux." },
  CSS: { level: 0.85, projects: ["alexendros-me", "nasve"], note: "Tailwind v4 (CSS-first) sobre tokens de diseño propios. Animaciones, layouts responsivos y diseño tipográfico." },
  HTML: { level: 0.88, projects: ["alexendros-me", "nasve"], note: "Semántica, accesibilidad (a11y) y SEO técnico como base de todo lo que se renderiza en el navegador." },
  "Next.js": { level: 0.86, projects: ["alexendros-me", "pipeline-crm", "stripe-catalog"], note: "App Router en producción: export estático para `.me`, RSC + backend propio para el portfolio y CRM." },
  React: { level: 0.85, projects: ["alexendros-me", "nasve"], note: "Server Components por defecto, islas cliente solo donde aportan interacción real." },
  Tailwind: { level: 0.82, projects: ["alexendros-me", "nasve"], note: "Tailwind v4 (CSS-first) sobre tokens de diseño propios — oklch dark-first en `.me`, Arctic Ocean aquí." },
  "Node.js": { level: 0.8, projects: ["pipeline-crm", "stripe-catalog"], note: "Runtime de los Route Handlers y el tooling de build. Migro a Rust/Go cuando el caso lo pide." },
  Astro: { level: 0.72, projects: ["alexendros-me"], note: "SSG ligero para contenido estático: blogs, documentación y landings con cero JS por defecto." },
  Docker: { level: 0.85, projects: ["mcp-toolkit", "pipeline-crm"], note: "Empaquetado consistente de servicios para que se desplieguen igual en cualquier entorno." },
  Supabase: { level: 0.82, projects: ["pipeline-crm", "stripe-catalog"], note: "PostgreSQL gestionado con auth, storage y realtime. Self-hosted en Coolify para control total de los datos." },
  Vercel: { level: 0.85, projects: ["alexendros.me", "nasve", "stripe-catalog"], note: "Despliegue y red global para que los sitios carguen rápido en cualquier parte, con vistas previas en cada cambio." },
  OpenTelemetry: { level: 0.78, projects: ["mcp-toolkit"], note: "Instrumentación vendor-neutral exportada a SigNoz: trazas y métricas de extremo a extremo." },
  Coolify: { level: 0.75, projects: ["pipeline-crm"], note: "PaaS self-hosted para desplegar servicios, bases de datos y aplicaciones en servidores propios con la simplicidad de Heroku." },
  Cloudflare: { level: 0.78, projects: ["pipeline-crm", "alexendros.me"], note: "DNS, túneles (Cloudflare Tunnel) y CDN: expone servicios internos sin abrir puertos y acelera la entrega global." },
  MCP: { level: 0.85, projects: ["mcp-toolkit", "pipeline-crm"], note: "Model Context Protocol como interfaz estándar para que los agentes IA accedan a herramientas y datos externos." },
  OpenCode: { level: 0.86, projects: ["alexendros-me", "stripe-catalog"], note: "Agente de codificación open source: asistente de desarrollo local con múltiples proveedores LLM y contexto del proyecto." },
  CommandCode: { level: 0.84, projects: ["alexendros.me", "pipeline-crm"], note: "Plataforma de agentes de codificación: skills, taste system y gestión de memoria para desarrollo asistido por IA." },
  "GitHub Actions": { level: 0.84, projects: ["mcp-toolkit", "pipeline-crm", "stripe-catalog"], note: "CI en todos los repos: format → lint → typecheck → test → build, validadores y pre-commit hooks." },
  "JSON Schema": { level: 0.82, projects: ["mcp-toolkit"], note: "draft-07 como contrato de datos: esquemas que validan configuraciones y entradas antes de procesarlas, con errores claros en CI." },
  Notion: { level: 0.8, projects: ["pipeline-crm"], note: "Sync bidireccional con Notion como CRM alternativo: deals, contactos y pipeline reflejados en tiempo real." },
  "GNU/Linux Ubuntu 26": { level: 0.88, projects: ["mcp-toolkit", "pipeline-crm"], note: "Entorno de desarrollo y producción principal: scripting, containers, servicios y monitorización." },
  Lenguajes: { level: 0.86, projects: ["mcp-toolkit", "pipeline-crm", "stripe-catalog"], note: "Rust para sistemas, Python para tooling, TypeScript para web, Bash para verificación: cada herramienta para su trabajo." },
  Web: { level: 0.85, projects: ["alexendros.me", "nasve", "stripe-catalog"], note: "Next.js + React + Tailwind sobre tokens propios; rendimiento y accesibilidad antes que efectos." },
  Infraestructura: { level: 0.8, projects: ["pipeline-crm", "mcp-toolkit"], note: "Bases de datos, despliegue y monitorización para que lo que construyo sea fiable, rápido y fácil de mantener." },
  "Herramientas e IA": { level: 0.86, projects: ["mcp-toolkit", "pipeline-crm"], note: "MCP, OpenCode y CommandCode como base para construir agentes y herramientas reproducibles que aceleran el desarrollo." },
};
