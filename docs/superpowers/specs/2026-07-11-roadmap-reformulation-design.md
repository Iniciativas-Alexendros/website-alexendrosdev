# Diseño: Reformulación del roadmap — tracks paralelos F15-F18

**Tipo**: Revisión estratégica + planificación
**Fecha**: 2026-07-11
**Estado**: diseño aprobado (enfoque B)
**Contexto**: brainstorming session sobre ROADMAP.md, AGENTS.md y fases pendientes

---

## 1. Diagnóstico

El ROADMAP.md actual (436 líneas) tiene problemas de mantenibilidad:

- **4 estados de cierre obsoletos** (2026-06-01, 2026-06-09, 2026-06-15, 2026-07-05) que no reflejan el estado real (2026-07-11).
- **Bloqueos activos desactualizados**: F14 y infra Coolify ya están resueltos. F4.3, F13, F14b son bloqueos blandos (código hecho, falta credencial del operador).
- **Referencia a plan externo obsoleto** (`~/.claude/plans/implementa-este-dise-o-para-calm-cray.md`).
- **Fases F17/F17.5b** (Stripe live activation) están inline en el roadmap pero no en la tabla de fases del AGENTS.md.
- **Estructura lineal** que no reconoce el paralelismo real del trabajo pendiente.

Estado real del proyecto:

| Hecho                                              | Pendiente                            |
| -------------------------------------------------- | ------------------------------------ |
| F0-F10, F11, F12, F13, F14, F14b                   | F15 (agentes IA)                     |
| F17 Stripe live activation + F17.5b live price IDs | F16 (gates finales)                  |
| 219 tests, build 32 rutas, lint/typecheck 0        | Monitorización (no planificada)      |
| Stripe live activo (`sk_live_...`)                 | Contenido/marketing (no planificado) |

---

## 2. Nuevos departamentos urgentes

Identificados en brainstorming:

1. **Monitorización full-stack** (F17 nueva): Vercel + Supabase + MiniPC + Stripe webhooks. Sin ella, el sitio en producción es un punto ciego.
2. **Contenido & Marketing** (F18 nueva): pipeline editorial del blog, newsletter real, analytics. El blog y la newsletter tienen infraestructura pero sin operación.

---

## 3. Estructura final: 4 tracks

```
F15 (Agentes IA) ──────────┬──────► F16 (Gates) ──► F18 (Contenido)
                           │
F17 (Monitorización) ──────┘ (independiente, paralelo a F15)
```

| Fase | Nombre                           | Estado    | Depende de         | Track |
| ---- | -------------------------------- | --------- | ------------------ | ----- |
| F15  | Agentes IA autónomos + Hardening | pendiente | F14, F14b          | A     |
| F16  | E2E + Gates finales              | pendiente | F15                | C     |
| F17  | Monitorización full-stack        | pendiente | — (paralelo a F15) | B     |
| F18  | Contenido & Marketing            | pendiente | F16                | D     |

### 3.1 Track A — F15: Agentes IA autónomos + Hardening

Ya existe spec de diseño (`docs/superpowers/specs/2026-07-09-f15-agentes-ia-design.md`, 397 líneas). Cambios respecto a ese spec:

**Provider LLM híbrido** (antes solo OpenCode Zen):

```
gemini-3.5-flash (primario, Google Gemini API gratuita, 1M contexto, thinking budgets)
  → deepseek-v4-flash-free (fallback 1, OpenCode Zen)
    → mimo-v2.5-free (fallback 2, OpenCode Zen)
      → north-mini-code-free (fallback 3, OpenCode Zen, solo Reparador)
        → confidence: 0 / action: "none" (degradación total)
```

Racional: Gemini 3.5 Flash es el más capaz en razonamiento (thinking budgets, 1M tokens de contexto), estable (no en feedback period), y gratuito. Los 3 modelos free de OpenCode Zen son fallbacks ante rate limits o indisponibilidad de Gemini.

**Reparador ahora usa LLM** (antes era solo determinista). El Reparador recibe el diagnóstico del Diagnosticador, usa LLM para decidir qué acción correctiva aplicar y generar el payload adecuado para la CRM API. Sigue siendo determinista en la ejecución (el LLM decide qué hacer, el código ejecuta).

**Nuevas env vars**:

| Variable               | Requerida | Default | Descripción                              |
| ---------------------- | --------- | ------- | ---------------------------------------- |
| `GEMINI_API_KEY`       | No        | —       | API key para Gemini 3.5 Flash (gratuita) |
| `OPENCODE_ZEN_API_KEY` | No        | —       | API key para OpenCode Zen free models    |

Ambos providers son independientes: si uno falla, el otro se usa. Si ambos fallan, degradación determinista.

### 3.2 Track B — F17: Monitorización full-stack

| #    | Tarea                                                     | Notas                                                                                                                                                                                                 |
| ---- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17.1 | Health endpoint `GET /api/health`                         | JSON con status por servicio: DB (Prisma ping), Stripe (API reachable), Resend (key present), MiniPC (Ollama/Coolify reachable). Null-safe: si un servicio no está configurado, `status: "disabled"`. |
| 17.2 | Uptime monitor externo                                    | Uptime Robot (gratuito, 5 min interval) o `cron-job.org` pinging `/api/health`. Alerta por email si 3 checks consecutivos fallan.                                                                     |
| 17.3 | SigNoz: instrumentar Next.js con OTEL                     | `@vercel/otel` (soporte nativo de Vercel) exportando a SigNoz en la MiniPC vía Cloudflare Tunnel. Traces de Route Handlers y RSC.                                                                     |
| 17.4 | Dashboard SigNoz: latencia, errores, percentiles          | Plantillas de SigNoz para: latencia por ruta, tasa de error 4xx/5xx, p95/p99. Sin código custom.                                                                                                      |
| 17.5 | Dashboard Supabase: conexiones, tamaño, slow queries      | Métricas vía `pg_stat_activity` + `pg_stat_user_tables`. Script en cron en MiniPC que expone métricas a SigNoz.                                                                                       |
| 17.6 | Monitoreo Stripe: webhook failures, checkout success rate | Logging estructurado en `/api/stripe/webhook` (ya existe `console.log`). Dashboard SigNoz con esos logs.                                                                                              |
| 17.7 | Monitoreo MiniPC: Ollama, Coolify, Cloudflare Tunnel      | Script health en la MiniPC (`/opt/health/minipc-health.sh`) ejecutado por cron, expone JSON a endpoint local que SigNoz scrapea.                                                                      |
| 17.8 | Alertas: canal email vía Resend                           | Cuando `RESEND_API_KEY` esté configurado, alertas críticas → email. Mientras tanto, solo dashboards SigNoz.                                                                                           |

Duración estimada: 1-2 semanas. Cero dependencia de F15 o F16.

### 3.3 Track C — F16: E2E + Gates finales

Sin cambios respecto al plan actual:

| #    | Tarea                                                                           |
| ---- | ------------------------------------------------------------------------------- |
| 16.1 | 8 tests e2e (`/servicios`, `/escaparate`, `/checkout/success`, a11y multi-ruta) |
| 16.2 | Lock-in cobertura: statements ≥85%, branches ≥80%, functions ≥85%, lines ≥85%   |
| 16.3 | Gates calidad: lint 0, typecheck 0, build verde, format OK                      |
| 16.4 | Actualizar ARCHITECTURE.md (rutas CRM, Subscription, agentes IA)                |

Depende de F15 completado (los e2e deben cubrir el sistema con agentes IA activos).

### 3.4 Track D — F18: Contenido & Marketing

Pipeline editorial mínimo + activar lo ya construido:

| #    | Tarea                                                      | Notas                                                                                        |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 18.1 | Activar Resend con `RESEND_API_KEY` real                   | Infraestructura React Email + Resend client hecha (F4.3). Solo falta la clave del operador.  |
| 18.2 | Calendario editorial: `content/blog/editorial-calendar.md` | 4 posts planificados (temas, fechas, keywords). Artefacto de planificación en el repo.       |
| 18.3 | Templates newsletter: mensual + anuncio de post            | La bienvenida ya existe (`emails/welcome.tsx`). Dos variantes nuevas reutilizando el layout. |
| 18.4 | 2 posts iniciales en MDX                                   | Pipeline de renderizado MDX funciona desde F3.3.                                             |
| 18.5 | Endpoint `POST /api/newsletter/send`                       | Admin endpoint protegido con `CRM_API_KEY`. Dispara envío a todos los subscribers.           |
| 18.6 | Analytics con Plausible (privacy-first)                    | Script de 1KB en `layout.tsx`. Alternativa: Umami self-hosted en Coolify si se prefiere.     |

Depende de F16 completado (disciplina: no producir contenido con gates de calidad pendientes).

---

## 4. Limpieza del ROADMAP.md

### 4.1 Elementos a eliminar

- Estados de cierre: 2026-06-01, 2026-06-09, 2026-06-15 (líneas 341-437). Conservar solo el más reciente (2026-07-05, líneas 360-378) como referencia histórica, con una nota de que está superado por este diseño.
- Sección "Bloqueos activos" (líneas 381-386): mover a "Configuración pendiente del operador".
- Referencia `~/.claude/plans/implementa-este-dise-o-para-calm-cray.md` (línea 5).
- Nota "Worktree: `wt/catalog-pipeline-str-f16`" (línea 336): ya no aplica.

### 4.2 Elementos a consolidar

- F17 + F17.5b: mantener como sub-secciones dentro de F7 (nota de activación), no como fases independientes.
- Tabla de cobertura (líneas 221-233): actualizar al valor real medido.

### 4.3 Sección nueva: "Configuración pendiente del operador"

Centraliza las credenciales que el código ya soporta pero faltan para activación real:

| Variable                                                          | Fase | Efecto sin ella                   |
| ----------------------------------------------------------------- | ---- | --------------------------------- |
| `RESEND_API_KEY`                                                  | F4.3 | Emails → `console.log`            |
| `TRANSFER_IBAN` + `TRANSFER_BENEFICIARY`                          | F13  | Canal transferencia → 503         |
| `NOTION_API_KEY` + `NOTION_CONTACTS_DB_ID` + `NOTION_DEALS_DB_ID` | F14b | Sync Notion → warn                |
| `NOTION_WEBHOOK_SECRET`                                           | F14b | Webhook Notion → ack sin procesar |

---

## 5. Actualizaciones en AGENTS.md

### 5.1 Tabla de fases

Añadir F15-F18:

```
| **F15**  | Agentes IA autónomos + Hardening (TS integrado, Gemini + Zen)   | **pendiente** — desbloqueado por F14+F14b |
| **F16**  | E2E + Gates finales — lock-in cobertura 85/80/85/85              | **pendiente** — depende de F15            |
| **F17**  | Monitorización full-stack (SigNoz, health, alertas)              | **pendiente** — paralelo a F15            |
| **F18**  | Contenido & Marketing (blog, newsletter, analytics)              | **pendiente** — depende de F16            |
```

### 5.2 Cobertura

Actualizar de "gate 93/86/95/92" al valor real medido con 219 tests post-F14b.

### 5.3 Infraestructura

- Stripe: de "⚠️ null-safe, clave pendiente" → "✅ live activo (`sk_live_...`)"
- Añadir Gemini API (gratuita) como provider LLM
- Añadir Plausible/Umami como analytics planeado

### 5.4 Provider LLM

Documentar la cadena: Gemini 3.5 Flash → DeepSeek V4 Flash Free → MiMo V2.5 Free → North Mini Code Free.

---

## 6. Actualizaciones en ARCHITECTURE.md

| Sección              | Cambio                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Stack / Agentes IA   | De "Python/FastAPI externo (`localhost:8400`)" → "Módulos TS integrados en `src/lib/agents/`, Gemini 3.5 Flash + OpenCode Zen free" |
| Stack / Pagos        | De "(F17)" → "live activo (F17 + F17.5b)"                                                                                           |
| Árbol de directorios | Añadir `src/lib/agents/` y `src/app/api/agents/`                                                                                    |
| Árbol de rutas       | Añadir `/api/agents/*` y `/api/health`                                                                                              |

---

## 7. No-objetivos

- No se reescribe el ROADMAP desde cero (se limpia quirúrgicamente).
- No se añaden más departamentos (monitorización y contenido son suficientes).
- No se cambia la numeración de fases existentes.
- No se modifica el spec F15 existente más allá del provider LLM y Reparador→LLM.

---

## 8. Plan de implementación

Orden de ejecución (tras commit de este design doc):

1. **Limpiar ROADMAP.md** — eliminar obsoletos, consolidar, añadir F15-F18.
2. **Actualizar AGENTS.md** — tabla de fases, cobertura, infra, provider LLM.
3. **Actualizar spec F15** — nuevo provider híbrido, Reparador con LLM, nuevas env vars.
4. **Actualizar ARCHITECTURE.md** — agentes integrados, tracks, rutas nuevas.
5. **Verificación**: lint, typecheck, format, build (sin cambios de código, solo docs).
6. **Commit único** con mensaje descriptivo.

Las fases F15, F17, F16 y F18 se implementarán en sesiones posteriores siguiendo el orden de tracks definido aquí.
