# ADR-004: Prisma como ORM

## Estado
Aceptado

## Contexto
El proyecto requiere acceso a base de datos con tipado estático end-to-end, migraciones versionadas y compatibilidad con Server Components.

## Decisión
Usar **Prisma** como ORM principal con `prisma.config.ts`.

## Alternativas consideradas
- **Drizzle ORM** — más ligero y compatible con Edge Runtime nativo; candidato para migración futura si el bundle de Prisma Client resulta problemático en Edge
- **Kysely** — type-safe pero sin migraciones automáticas
- **Raw SQL** — máximo control pero sin tipado automático

## Consecuencias
- Tipado automático generado del schema
- Migraciones versionadas
- Prisma Client no compatible con Edge Runtime sin Accelerate — usar Node Runtime para queries
- Bundle size elevado — considerar Drizzle en v2 si se adopta Edge-first

## Notas futuras
Evaluar migración a **Drizzle ORM** en v2.

## Referencias
- https://www.prisma.io/docs
- https://orm.drizzle.team
