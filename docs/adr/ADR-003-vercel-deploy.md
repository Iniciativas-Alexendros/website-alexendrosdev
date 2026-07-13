# ADR-003: Vercel como plataforma de deploy

## Estado
Aceptado

## Contexto
Se necesita una plataforma que soporte Next.js de forma nativa, con Preview Deployments por PR, Edge Network, y zero-config para ISR/PPR/Edge Runtime.

## Decisión
Usar **Vercel** como plataforma de deploy. Dominio `alexendros.dev` apunta a Vercel. Branch `main` = producción. Cada PR genera Preview URL automática.

## Alternativas consideradas
- **Coolify (self-hosted)** — ya en uso para otros servicios, pero las optimizaciones propietarias de Vercel para Next.js (ODB, ISR flush, Edge Middleware) no están disponibles fuera
- **Netlify** — adaptador no oficial para App Router; peor DX
- **Cloudflare Pages** — Edge-first pero Node runtime limitado; incompatible con Prisma directo

## Consecuencias
- ISR, PPR, Edge Middleware zero-config
- Preview Deployments por PR — Lighthouse CI ejecuta sobre URL real
- Vercel Analytics y Speed Insights integrados
- Vendor lock-in mitigado (Next.js es de Vercel de todas formas)

## Referencias
- https://vercel.com/docs/frameworks/nextjs
