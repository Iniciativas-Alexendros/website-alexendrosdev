# ADR-001: Next.js App Router como arquitectura base

## Estado

Aceptado

## Contexto

El website de alexendros.dev requiere máximo rendimiento, SEO técnico de primer nivel, y capacidad de evolucionar durante años. Se necesita una arquitectura que permita Server Components nativos, Streaming, PPR y Edge Runtime.

## Decisión

Usar **Next.js 15+ con App Router** como framework principal, desplegado en Vercel.

## Alternativas consideradas

- **Remix** — buen modelo de datos, ecosistema más pequeño, menor integración con Vercel
- **Astro** — excelente para contenido estático, más limitado para Server Actions
- **Pages Router** — obsoleto; no soporta RSC nativamente

## Consecuencias

- Server Components por defecto — mínimo JS al cliente
- Streaming y Suspense nativos
- Metadata API integrada — SEO sin librerías externas
- Deploy zero-config en Vercel
- Caching model de Next.js 15 más explícito — requiere disciplina

## Referencias

- https://nextjs.org/docs/app
