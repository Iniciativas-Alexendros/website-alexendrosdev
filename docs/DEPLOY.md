# Deployment stages — Vercel (alexendros-team)

Guía operativa para decidir **dónde** desplegar cada cambio. Define los tres entornos de Vercel (Development, Preview, Production) y cuándo usar cada uno.

> Válido desde `DEPLOY_GUIDE_VERSION=2026-07-07`. Si este doc cambia, bumpear la env var en los 7 proyectos.

## Resumen de una línea

| Etapa           | Cuándo                                                                  | Trigger                         | URL                                                       |
| --------------- | ----------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| **Production**  | Cambio validado, listo para usuarios reales                             | Push a `main`                   | `alexendros.dev`, `afiladocs-…vercel.app`, etc.           |
| **Preview**     | Cambio en revisión (PR), quieres review visual/staging antes de mergear | Push a cualquier rama no-`main` | `<project>-<hash>-alexendros-team.vercel.app`             |
| **Development** | Smoke test contra infra real (Stripe test, DB staging, Supabase real)   | Push a rama `develop`           | `<project>-git-develop-<hash>-alexendros-team.vercel.app` |

## Configuración de los entornos

Los 7 proyectos (`website-alexendrosdev`, `afiladocs`, `landing-ab-testing`, `website-alexendrosme`, `rejas-ballesta`, `ecom-graficasnasve`, `atlaps`) tienen las tres environments configuradas en Vercel. Cada una tiene su propio set de env vars.

### Env vars de la environment **Development** (Pre-production)

Marcadores añadidos el 2026-07-07 a los 7 proyectos:

| Var                             | Valor                               | Propósito                                                      |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `ENVIRONMENT_STAGE`             | `development`                       | Identifica la environment en runtime para debug/feature flags. |
| `DEPLOY_GUIDE_VERSION`          | `2026-07-07`                        | Versión de este doc. Bumpear al modificar reglas.              |
| `ALLOWED_BRANCHES`              | `main,develop,feat/*,fix/*,chore/*` | Convencional, documenta qué ramas disparan qué stage.          |
| `VERCEL_GIT_DEPLOYMENT_ENABLED` | `1`                                 | Confirma que el deploy automático por Git está activo.         |

> **Importante**: las env vars reales (claves de Stripe, Resend, Supabase, etc.) deben ser **diferentes** entre las tres environments. En Development se usan **claves test/sandbox** para evitar cobros o escrituras en producción.

## Cuándo desplegar en cada entorno

### Production (push a `main`)

**Usar cuando:**

- El cambio está mergeado, revisado y los checks de CI están en verde.
- Quieres que los usuarios reales lo vean.
- Es un release que aparece en el changelog / release-please.

**Trigger:** push directo a `main` o merge de PR → Vercel detecta el push en `main` y despliega a producción.

**Dominios asignados:**

| Proyecto                | Dominio de producción             |
| ----------------------- | --------------------------------- |
| `website-alexendrosdev` | `alexendros.dev`                  |
| `afiladocs`             | `afiladocs-…vercel.app` (default) |
| `landing-ab-testing`    | `landing-ab-testing.vercel.app`   |
| `website-alexendrosme`  | `alexendros.me`                   |
| `rejas-ballesta`        | `rejas-ballesta.vercel.app`       |
| `ecom-graficasnasve`    | `ecom-graficasnasve.vercel.app`   |
| `atlaps`                | `atlaps.vercel.app`               |

**Reglas:**

- **Nunca** pushear directamente a `main` (usar PR + merge).
- Asegurar que el gate de CI pasa: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage`.
- Verificar que el commit sigue Conventional Commits (release-please-bot se encarga del versionado).

### Preview (PR / push a rama no-main)

**Usar cuando:**

- Abres un PR y quieres review visual o smoke test contra la infra real.
- Quieres validar un cambio sin tocar producción.
- Es el default al pushear a `feat/*`, `fix/*`, `chore/*`, `release-please--*`, etc.

**Trigger:** push a cualquier rama distinta de `main` y `develop` → Vercel crea un deployment preview con URL única.

**URL:** `https://<project>-<git-sha>-alexendros-team.vercel.app`

**Reglas:**

- Cada push a la rama crea un nuevo preview; los antiguos se mantienen pero pueden caducar.
- Los previews usan las env vars de **Preview** (no Development, no Production). Configurar ahí las claves test si necesitas integración real.
- Para Vercel comments en PR: requiere el GitHub App de Vercel instalado y `VERCEL_GIT_COMMENT_ENABLED` activo.

### Development (Pre-production) — push a `develop`

**Usar cuando:**

- Quieres probar contra la infra de Supabase staging / Stripe test / Resend test antes de promover a producción.
- Estás haciendo una batería de smoke tests manuales (login, checkout, formularios) que requieren backend real.
- Es un cambio de infra (migración de DB, nuevas env vars) que quieres validar en vivo sin afectar `main`.

**Trigger:** push a la rama `develop` → Vercel asigna alias con prefijo `-git-develop-`.

**URL:** `https://<project>-git-develop-<git-sha>-alexendros-team.vercel.app`

**Reglas:**

- Esta environment debe tener **claves test/sandbox** (no las de producción):
  - Stripe: clave `sk_test_…`
  - Resend: API key de test
  - Supabase: URL del proyecto staging o rama de DB
  - DB: una DB de staging con las mismas migraciones aplicadas
- No usar para validar UI/visual (eso es Preview). Usar para validar **integraciones reales**.
- Los deployments de Development caducan tras 7 días por defecto en Vercel Hobby / Pro.

## Diagrama de flujo

```
   feature branch                develop branch                  main branch
   (feat/*, fix/*)               (pre-production)                (production)
        │                              │                              │
        │  push                        │  push                        │  push
        ▼                              ▼                              ▼
   ┌─────────┐                    ┌─────────┐                    ┌─────────┐
   │ Preview │ ── merge ──▶       │Develop. │ ── merge ──▶       │   Prod  │
   │  URL    │   (PR)             │  URL    │   (PR)             │   URL   │
   └─────────┘                    └─────────┘                    └─────────┘
   • review visual                • smoke tests reales           • usuarios reales
   • claves preview/test          • claves test/sandbox          • claves live
   • caduca en 7d                 • caduca en 7d                 • permanente
```

## Workflow recomendado

1. **Trabajo en rama feature**: `git checkout -b feat/<cosa>`
2. **Push a la rama** → Vercel crea **Preview** automáticamente.
3. **Abro PR** → los Vercel comments aparecen con el link al preview.
4. **Reviewers validan** el preview, aprueban el PR.
5. **Si hay cambios de infra que requieren backend real** (migración, nuevos endpoints con Stripe, etc.) → fusionar primero a `develop`, hacer smoke test, después mergear a `main`.
6. **Merge a `main`** → Vercel despliega a **Production** automáticamente.
7. **Release-please bot** abre un PR de release con el versionado.

## Comandos CLI útiles

```bash
# Listar deployments recientes (todos los proyectos del team)
export VERCEL_TOKEN=$(pass-cli item view --item-title Vercel --vault-name Infraestructura | grep VERCEL_TEAM | grep -oP '"\K[^"]+')
vercel ls

# Inspeccionar un deployment concreto
vercel inspect <url-deployment>

# Ver logs de runtime
vercel logs <url-deployment>

# Pull de env vars de una environment a .env.local
vercel env pull .env.local --environment development
```

> El token correcto es `VERCEL_TEAM` (no `VERCEL_TOKEN`, que es el personal sin acceso al team). Ambos están en el item "Vercel" de pass-cli (vault `Infraestructura`).

## Política de protección

- **Branch protection en `main`**: requiere CI green + 1 review (configurar en GitHub repo settings).
- **Branch protection en `develop`**: requiere CI green (puede auto-merge).
- **Secret scanning**: GitHub bloquea commits con patrones de claves (`.env*` nunca en repo, sólo `.env.example`).
- **Vercel Deployment Protection**: activar password protection para production y development si contienen datos de clientes reales. Preview suele ser público por URL única.

## Troubleshooting

| Síntoma                                                  | Causa probable                                  | Acción                                             |
| -------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `pnpm install` falla con `MINIMUM_RELEASE_AGE_VIOLATION` | Dependabot PR con paquete publicado < 24h       | Cerrar PR, Dependabot lo recreará al envejecer     |
| Build falla con error MDX                                | Literales `<numéricos` o sintaxis JSX en `.mdx` | Envolver en backticks: `` `5 cosas` ``             |
| `Command "pnpm run build" exited with 1`                 | Ver `vercel inspect <url> --logs`               | Corregir localmente con `pnpm build`, commit, push |
| Deployment canceled: unverified commit                   | Push directo sin firma / sin GitHub App         | Configurar GitHub App de Vercel, usar PR           |
| Preview 404 / no asigna alias                            | Branch protegida o sin GitHub App               | Verificar settings de Vercel → Git                 |
