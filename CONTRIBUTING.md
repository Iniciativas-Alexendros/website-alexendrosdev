# Cómo contribuir a website-alexendrosdev

Gracias por interesarte en mejorar este proyecto. Este documento define el flujo
de desarrollo y las normas del repositorio.

---

## Antes de empezar

1. Lee `README.md` para entender el stack y la estructura.
2. Abre un issue describiendo el problema o la propuesta.
3. Instala las dependencias: `npm install`
4. Configura las variables de entorno copiando `.env.example` → `.env.local`.

## Stack

- **Framework**: Next.js 16 + React 19
- **Lenguaje**: TypeScript 5.8 (strict)
- **Estilos**: Tailwind CSS v4
- **Tests**: Vitest + Testing Library
- **Linting**: ESLint 9 (flat config) + Prettier
- **Package manager**: npm

## Convenciones de commits

Sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(alcance)?: descripción
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `ci`, `chore`
Ejemplo: `feat(checkout): añade validación de dirección fiscal`

## Checks automáticos

Antes de enviar un PR, asegúrate de que pasan:

```bash
npm run lint          # ESLint — 0 errores
npm run typecheck     # TypeScript — 0 errores
npm run test          # Vitest — todos los tests pasan
```

## Estructura del proyecto

```
├── src/
│   ├── app/            # App Router (Next.js)
│   ├── components/     # Componentes React
│   ├── lib/            # Utilidades y helpers
│   ├── hooks/          # Custom hooks
│   ├── types/          # Tipos TypeScript
│   └── emails/         # Plantillas React Email
├── public/             # Assets estáticos
├── tests/              # Tests (unit, integration, component)
└── ...
```

## Desarrollo

```bash
npm run dev           # Dev server en :3000
npm run build         # Build de producción
npm run lint          # Lint
npm run typecheck     # Type check
npm run test          # Tests
npm run format        # Prettier
```

## Pull Requests

- Tamaño máximo: ~500 líneas cambiadas. Divide PRs grandes.
- Incluye descripción clara de los cambios.
- Referencia el issue que resuelve (ej: `Closes #12`).
- Todos los checks deben pasar antes del merge.

## Convenciones de código

- **TypeScript**: sin `any`, sin `@ts-ignore` sin justificación.
- **Componentes**: functional components + hooks.
- **Server Components** por defecto; `"use client"` solo cuando sea necesario.
- **Estilos**: Tailwind utility classes. `cn()` para composición condicional.
- **Imports**: alias `@/` → `src/`.
- **Env vars**: importar desde `@/lib/env` — nunca `process.env` directo.
- **SDKs**: lazy init dentro de funciones, nunca a nivel de módulo.

## Seguridad

- Nunca expongas `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` ni `RESEND_API_KEY` al cliente.
- Nunca uses `NEXT_PUBLIC_*` para claves privadas.
- Valida inputs siempre con Zod en API routes.

## Contacto

- Issues: GitHub Issues
- Email: contacto@alexendros.me
