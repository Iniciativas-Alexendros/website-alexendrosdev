# AUDITORÍA CRÍTICA — website-alexendrosdev (repo + sitio)

> **Veredicto:** el repo que ya era limpio se ha puesto serio — cerró la ruta del dinero y blindó el CRM — pero la hornada de agentes LLM se coló por la puerta de atrás con una auth de pega, y el front se lanzó con texto que no llega al AA. Nada catastrófico; un GRAVE de nuevo diseño y un puñado de heridas moderadas que un par de tardes dejan el sitio en despacho de abogados.

**Resumen ejecutivo.** Repo Next.js 16 fullstack que creció de ~4.780 a ~35.6k LOC y de 11 a **26 defectos** desde la última auditoría (`ad4288a`, Jul 1) hasta `651f51c` (rama `feat/restructure-content`). La buena noticia es que **los 7 defectos que importaban de la pasada están resueltos**: el webhook ya devuelve 500 (`DEFECTO-001`), la IP se toma del último salto de confianza (`DEFECTO-002`), el `Map` del rate-limit ya purga (`DEFECTO-003`), el newsletter es double opt-in (`DEFECTO-005`), el JSON-LD escapa `<` (`DEFECTO-007`), el contacto devuelve 502 honesto (`DEFECTO-004`), y el CRM añadió auth timing-safe con rate-limit. La mala: el módulo `/api/agents/*` (4 rutas, incluida una que muta el CRM) **esquivó** todo ese cuidado y valida la API key con `!==` no-constante y **cero** rate-limit — un regresión de seguridad de manual. El sitio vivo, por su parte, es un Ferrari (Lighthouse 100/100/100/92) con los cinturones rotos: `--text-tertiary` a 3.8:1 falla AA en todas las páginas.

**Alcance auditado.** Repo local `~/projects/website-alexendrosdev` (commit `651f51c`, rama `feat/restructure-content`), 267 ficheros versionados, ~35.620 LOC (`tokei`). Sitio en producción `https://alexendros.dev` (Vercel) auditado por HTTP/axe/Lighthouse. Modo **COMBINADO**, profundidad **PROFUNDO**, con parches para CATA/GRAVE. Comparación contra `AUDITORIA-CRITICA.md` previo (`ad4288a`).

**Modo de ejecución: COMPLETO** — shell con red real. Herramientas: `gitleaks`, `semgrep`, `tokei`, `tsc`, `eslint`, `prettier`, `pnpm audit`, `knip`, `jscpd`, `next build`, `lighthouse`, `axe-core/playwright`. `trivy`/`scc`/`bandit` ausentes (no aplican: no hay Dockerfile ni Python); vectores cubiertos por `semgrep` + `pnpm audit` + revisión manual. `lighthouse` se instaló vía `devDependencies` (ya en el árbol).

---

## 1. INFORME DE CRÍTICA DESTRUCTIVA

### 1.1 Arquitectura y Diseño

La arquitectura no solo aguanta: se ha puesto musculosa. Frontera cliente/servidor explícita (`"server-only"` en 8 módulos de datos), catálogo tipado como fuente de verdad, degradación null-safe coherente, y un módulo CRM con validación de transiciones de pipeline (`isValidTransition`, `isTerminalStage`) que corta saltos ilegales entre stages. El nuevo `requireCrmAuth` centraliza auth timing-safe + rate-limit y lo consumen **10 de 11** rutas CRM. `madge` no encontró ciclos (build verde, 32 rutas). Hasta el agente reparador esquiva la inyección de LLM: las acciones propuestas por el modelo solo pueden caer en `tasks`/`activities`/`deals/[id]` PATCH, whitelist dura en `executeAction`.

> Insultantemente coherente, otra vez. El problema no es cómo está estructurado: es que alguien se olvidó de aplicar la estructura a media docena de rutas nuevas.

### 1.2 Implementación y Lógica

### DEFECTO-012 — El módulo de agentes se salta la auth endurecida y compara la API key con `!==` · `GRAVE` · `CONFIRMADO`

- **Ubicación:** `src/app/api/agents/diagnose/route.ts:11`, `src/app/api/agents/audit/route.ts:11`, `src/app/api/agents/repair/route.ts:11`, `src/app/api/agents/hooks/route.ts:16` (patrón idéntico en los 4).
- **Evidencia:** las 4 rutas hacen `const apiKey = req.headers.get("x-api-key"); if (!apiKey || apiKey !== process.env.CRM_API_KEY) return 401;`. En contraste, `requireCrmAuth` (`src/lib/crm-auth.ts`) — que las rutas CRM sí usan — aplica `timingSafeEqual` + rate-limit de 30 req/min por IP en el intento de auth + 60 req/min por clave. Los agentes **no** pasan por ahí.
- **El crimen:** dos fallos de diseño en una sola decisión. (a) **Comparación no constante en el tiempo**: `!==` sobre strings filtra la longitud de la clave por diferencia de latencia — timing attack trivial para ir deduciendo el `CRM_API_KEY` byte a byte. El repo ya tenía la función `safeEqual` con `timingSafeEqual`; los agentes decidieron no usarla. (b) **Cero rate-limit en auth**: un atacante puede martillear `X-API-Key` indefinidamente sin 429. El `requireCrmAuth` existe exactamente para esto y lo ignora.
- **Por qué arde:** `repair` y `audit` son rutas autenticadas que tocan negocio (`runReparador` muta deals/tasks vía CRM API, `runAudit` lee todo el pipeline). Dejarlas con una llave de goma y sin candado es exactamente el agujero que el resto del CRM cerró. No es un secreto filtrado: es una puerta blindada para todos menos para los agentes.
- **Categoría:** 1.2 / 1.3

### DEFECTO-013 — `/api/agents/repair` muta el CRM sin protección contra reenvío ni dry-run por defecto · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/app/api/agents/repair/route.ts:11-41` + `src/lib/agents/reparador.ts`.
- **Evidencia:** el endpoint ejecuta `runReparador(data)` que, salvo `x-dry-run: true`, llama `executeAction` → PATCH a `deals/[id]` (cambio de stage) o `POST tasks/activities`. No hay idempotencia (un mismo `dealId` + diagnóstico puede reprocesarse y mover el stage varias veces), y el `dryRun` depende de una cabecera que el cliente controla, no de un body firmado. El `audit` (`runAudit`) dispara anomalías pero el `repair` las actúa sobre datos reales.
- **El crimen:** un agente autónomo moviendo deals de pipeline en producción es potente; hacerlo sin reintento-idempotente ni un "modo simulación" por defecto es pedir un stage movido por accidente (o por un prompt injertado en el diagnóstico).
- **Por qué arde:** el riesgo está ya acotado por el whitelist de `executeAction`, así que no es RCE ni borrado masivo — pero un pipeline CRM con deals saltando de stage sin trazabilidad de "quién/por qué" es un dolor de auditoría real.
- **Categoría:** 1.2

El resto de la lógica crítica aguanta: `checkout.session.completed` hace `upsert` idempotente por `stripeSessionId` y auto-cierra deal (order 5); el `catch` del webhook ahora devuelve **500** (`webhook/route.ts:54`); `newsletter/confirm` consume el token de un solo uso y no revela si existe/caducó. Nada de `await` olvidados ni `catch {}` vacíos.

### 1.3 Vulnerabilidades de Seguridad

Sin secretos filtrados (`gitleaks detect` → **limpio en 144 commits**). El webhook de Stripe verifica firma y el de Notion verifica HMAC-SHA256 con `timingSafeEqual`. `CSP`/`HSTS`/`XFO`/`nosniff`/`Referrer-Policy` presentes y correctos en `next.config.ts`. `access-control-allow-origin: *` aparece en la home y en `/contacto` — **falso positivo descartado**: es un default de Vercel sobre recursos estáticos sin cookies ni `Authorization`; el `api/health` no expone secretos (solo booleans de "configured") y las rutas CRM no lo devuelven. No aplica.

### DEFECTO-012 — (ver 1.2) regresión de auth en `/api/agents/*`. · `GRAVE` · `CONFIRMADO`

### DEFECTO-014 — CI sólo audita CVE `high`; el 100 % de las advisories moderadas pasa de largo · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `.github/workflows/ci.yml:83` (`pnpm audit --audit-level=high`) y ausencia de `gitleaks`/`semgrep` en el pipeline.
- **Evidencia:** `pnpm audit` ahora reporta **3 moderate** (`postcss <8.5.10` XSS vía `</style>`, `@hono/node-server <1.19.13` middleware bypass, `@opentelemetry/core <2.8.0` unbounded alloc). El gate `--audit-level=high` las deja pasar. `semgrep` (13 WARNING) flagra 12 usos de action tags mutables (`actions/checkout@v4`, etc.) — supply-chain esperando. La CI no corre escáner de secretos ni SAST.
- **El crimen:** el proceso mejoró (antes ni auditaba) pero sigue ciego a moderadas y a mutables tags. El `postcss` XSS es transitivo de `next` (runtime), no tooling — sí toca el producto desplegado.
- **Por qué arde:** hoy severidad baja; el riesgo es que la primera CVE runtime con patch disponible se cuele igual. `pnpm up postcss` + bajar el gate a `moderate` + pinnear SHA de actions lo cierra.
- **Categoría:** 1.3 / 1.5

### 1.4 Rendimiento y Escalabilidad

Lighthouse desktop: **Performance 100, Best Practices 100, SEO 100**, FCP 0.3s, LCP 0.4s, TBT 0ms, CLS 0.008. El sitio es estático/SSG prerenderizado (`x-nextjs-prerender: 1`, `x-vercel-cache: HIT`). Sin N+1, sin `<img>` crudas (se usan `next/image`), sin fetch en cascada evitable. El rate-limit sigue en `Map` en memoria pero ahora con barrido perezoso anti-fuga (`rate-limit.ts:13-18`) — el `DEFECTO-003` de la pasada está corregido para instancia única; seguiría sin acotarse en multi-instancia, pero el código lo documenta y degrada a best-effort.

> Rendimiento: no hay por dónde agarrarle. Quienquiera que tuninge esto se merece una cerveza, no un reproche.

### 1.5 Deuda Técnica y Malas Prácticas

### DEFECTO-015 — Action tags mutables en CI (supply-chain) · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `.github/workflows/ci.yml:76-100` (12 `uses: ...@vN`) + `docs/ci-improvements/ci.yml` (idéntico).
- **Evidencia:** `semgrep` `github-actions-mutable-action-tag` ×12. `actions/checkout@v4`, `actions/setup-node@v4`, etc. sin pin a SHA de 40 chars.
- **El crimen:** un tag puede ser repunteado por el dueño de la action → ejecución de código arbitrario en el runner. Es exactamente la clase de incidente `trivy-action`/`kics` de 2024.
- **Por qué arde:** el repo es público y el CI corre con secrets; un tag comprometido = actor malicioso con tu `CRM_API_KEY`/Stripe en el runner. Pinnear a SHA cuesta 5 minutos.
- **Categoría:** 1.5 / 1.9

### DEFECTO-016 — Cadáveres e imports muertos reportados por knip · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** `src/lib/newsletter.ts:6` (`CONFIRM_TOKEN_TTL_MS` sin usar), `src/lib/agents/prompts.ts:42,146` (`getCrmContext`/`_resetCrmContextCache`), `src/lib/agents/schemas.ts:25`, `src/lib/agents/reparador.ts:259` (`repairResultSchema`), 20 tipos sin consumir (`CaseSection`, `Metric`, `Feature`, `StripePriceIds`, `CrmDeal`, `CrmTask`, `DiagnosticHypothesis`, los `*Input` de CRM, `Notion*`), y `src/emails/*.tsx` marcados como duplicate exports.
- **Evidencia:** `knip` (descontando worktrees y falsos positivos de Next): 10 unused exports + 20 unused exported types + 5 duplicate exports reales.
- **El crimen:** ruido de superficie que infla el árbol y confunde al lector. No arde; hiede.
- **Categoría:** 1.5

### DEFECTO-017 — `website-contenido-pendiente.md` suelto en la raíz del repo · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** `website-contenido-pendiente.md` (raíz).
- **Evidencia:** fichero de notas de trabajo de 78 líneas en la raíz versionado, sin dueño ni referencia. El `DEFECTO-008` de la pasada (`_shot.mjs`) sí se borró — este es su primo.
- **Categoría:** 1.5

El `30 TODO` de contenido sigue siendo deliberado (datos del portfolio en construcción), no deuda fosilizada. `engines` ya está en `package.json` (el viejo `DEFECTO-011`-parte lo pidió y se hizo).

### 1.6 Documentación y Legibilidad

De referencia, otra vez. `CLAUDE.md`, `README`, `ROADMAP`, `tests/README.md`, `.env.example` exhaustivos. Los comentarios explican el **porqué** (degradación, runtime nodejs, fuente de verdad del precio, por qué `timingSafeEqual`). El `crm-auth.ts` documenta la defensa contra fuerza bruta. Sin reproche real — solo que la defensa documentada no se aplica a los agentes (`DEFECTO-012`), que es irónico.

### 1.7 Pruebas y Cobertura

La suite saltó de 101 a **>700 tests** (22 → 50+ ficheros), con cobertura de gate intacta. Hay tests nuevos de integración para CRM (411 líneas), notion-sync (134), notion-webhook (190), checkout (405), agents (salud/auditor/hooks/repair), y `newsletter-confirm`. El webhook ahora tiene caso de `upsert` rechazado → 500 (cierra el viejo `DEFECTO-010`). `tsc --noEmit` → **0 errores**; `eslint` → 0 errores (formatter compact no instalado, pero `next lint` en build pasa). `jscpd` → 3,17 % (subió del 1,03 % por el new CRM, clonación menor en `notion-mapper.ts`/`notion-sync.ts`, no crítica).

> La cobertura es alta y, esta vez, la ruta del dinero tiene el test que le faltaba. El agujero ahora está en los agentes: no hay test que fuerce 50 intentos de auth para ver el 429, porque el 429 no existe ahí.

### DEFECTO-018 — Sin tests de la rama de auth de los agentes (el agujero no está cubierto) · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `tests/integration/` — no existe `agents-auth.test.ts` ni caso de fuerza bruta/rate-limit para `/api/agents/*`.
- **Evidencia:** los tests de agents cubren happy path (`diagnose`, `repair` dry-run, `hooks`, `audit`), pero ninguno ejercita `apiKey` inválido repetido ni la ausencia de `timingSafeEqual`. La cobertura pasa alrededor del agujero.
- **Categoría:** 1.7

### 1.8 Errores Microscópicos y Estilo

`key={i}` por índice bajó de 10 a **5** instancias (`grep` confirmado) — casi todo limpiado. Semgrep INFO: `unsafe-formatstring` en `webhook/route.ts:58` (`console.error("[stripe-webhook] error al procesar ${event.type}:", err)`) — **SOSPECHA de falsa**: `event.type` es un enum de Stripe, no entrada de usuario; sin vector de format-string. Descartado como defecto sustantivo. Cero `any`, cero `@ts-ignore` en `src/`.

### 1.9 DevOps, CI/CD y Despliegue

`vercel.json` limpio (cleanUrls, trailingSlash). Build verde (32 rutas, 2.5s). CI corre `format → lint → typecheck → test:coverage → build → audit --audit-level=high`. Falta: gate de `moderate` en audit, `gitleaks`/`semgrep` en pipeline, pin de SHA en actions (`DEFECTO-014`/`DEFECTO-015`). Deploy Git nativo a Vercel (prod/preview). Sin script de rollback documentado, pero es estático.

### 1.10 Licencias y Dependencias

`knip` flagra `GPL-3.0` / `AGPL-3.0` en `.github/workflows/ci.yml` — **falso positivo**: es la licencia de alguna action de terceros declarada en el YAML, no del repo (el repo no tiene `LICENSE` GPL). `pnpm audit`: 3 moderate (ver `DEFECTO-014`). Ninguna critical/high. Dependencias del ecosistema sanity (Next 16.2.9, React 19.2, Stripe 22, Prisma 7).

---

### 2.1 Rendimiento y Core Web Vitals (SITIO)

Ver `1.4`. Desktop 100/100/100/92. Móvil no medido en esta pasada (Lighthouse desktop preset); el SSG + `next/image` sugiere rendimiento móvil también fuerte, pero **no confirmado** — ver limitación en métricas. Sin quejas de rendimiento reales.

### 2.2 SEO y Descubribilidad (SITIO)

SEO Lighthouse **100**. `robots.txt` correcto (`Disallow: /api/`, Sitemap declarado). `sitemap.xml` lista 21 URLs (home, legales, proyectos, blog, servicios, escaparate, contacto) con `priority`/`changefreq` sensatos. Meta tags completos: `title`, `description`, `canonical`, OpenGraph + Twitter, 4 bloques JSON-LD (`WebSite`, `Person`, `ProfessionalService`, `BreadcrumbList`). `lang` implícito es-ES. Sin errores de indexación aparentes.

> SEO impecable. Si Google no te posiciona es por el contenido, no por la técnica.

### 2.3 Accesibilidad (SITIO)

Lighthouse a11y **92** (no 100). `axe-core` encuentra **contraste insuficiente (serious) en las 4 páginas auditadas** y un salto de heading en `/proyectos`.

### DEFECTO-019 — Texto por debajo de AA: `--text-tertiary` 3.8:1 en todas las páginas · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/styles/design-tokens.css:36` (`--text-tertiary: 210 12% 50%` = `#708090`) usado en `ak-hero-stats`, `ak-stat-lab`, `ak-terminal-title`, `ak-note`, `ak-tile-*` (vía `--text-muted` en el año), etc. (`site.css:40,66` y familia).
- **Evidencia:** `axe-core` reporta color-contrast serious en 78 nodos (home), 40 (contacto), 24 (servicios), 36 (proyectos). Cálculo directo: `#708090` sobre `#fafafa` (`--bg-base`) = **3.8:1**; WCAG AA exige **4.5:1** para texto normal. `--text-muted` (`#94a3b8`) baja a 2.48:1. El modo dark sí pasa (`--text-tertiary` 195 25% 57% = 4.7:1), así que el fallo es solo en light.
- **El crimen:** texto de apoyo (estadísticas hero, etiquetas de terminal, años de proyecto) por debajo del umbral de contraste. No es decoración opcional: es información legible para usuarios con baja visión o luz ambiental. Un portfolio cuyo público es empresas valora la claridad; 3.8:1 es ilegible en móvil a pleno sol.
- **Por qué arde:** es sistemático (todas las páginas), afecta a docenas de nodos, y la cura es de una línea de token: subir `--text-tertiary` a ~`210 14% 40%` (4.6:1) y `--text-muted` a ~`213 15% 50%` (4.5:1).
- **Categoría:** 2.3

### DEFECTO-020 — Salto de jerarquía de headings en `/proyectos` (h3 antes de h1) · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** `src/components/sections/projects/ProjectsView.tsx:45` (`<h3 class="ak-tile-title">`) dentro de una tarjeta `<Link>` que aparece **antes** del `<h1 class="ak-page-title">Proyectos</h1>` (línea 86).
- **Evidencia:** `axe-core` `heading-order` (moderate) en `/proyectos`: un `h3` se renderiza antes que el `h1` de la página (las tarjetas de proyecto listadas arriba del header en el DOM/SR order, o el `h1` no es el primer heading). Salta de "ninguno" a `h3`.
- **El crimen:** rompe la estructura de navegación por lectores de pantalla; el usuario oye `h3` sin `h1`/`h2` padre.
- **Categoría:** 2.3

### 2.4 Seguridad observable (SITIO)

Headers de seguridad correctos (ver 1.3). Sin `server` que filtre versión, sin `x-powered-by`. `permissions-policy` restringe camera/mic/geolocation. El `api/health` no expone secretos. Sin vector de seguridad observable en el sitio servido.

### 2.5 Buenas prácticas web y privacidad (SITIO)

`@vercel/analytics` + `@vercel/speed-insights` cookieless (privacidad-first, sin banner). CSP con `upgrade-insecure-requests`. Sin tracking de terceros salvo Stripe (necesario para checkout, correctamente allowlisted en `connect-src`/`frame-src`). `cache-control: must-revalidate` coherente con SSG. Sin quejas.

### 2.6 Calidad del frontend servido y enlaces (SITIO)

HTML válido, JSON-LD bien formado (4 bloques), sin enlaces rotos en las rutas principales (sitemap coherente con las rutas del build). `canonical` presente. Sin `hreflang` (sitio mono-idioma, no aplica). Sin 404 ruidosos.

---

## 2. PLAN DE SANEAMIENTO CON CHECKLIST ADAPTABLE

**DEFECTO-012 — Los agentes deben usar `requireCrmAuth` (auth real, no de pega)**

- **Acción:** reemplazar el bloque `if (!apiKey || apiKey !== process.env.CRM_API_KEY)` en las 4 rutas por `const authErr = requireCrmAuth(req); if (authErr) return authErr;`. Eso añade `timingSafeEqual` + rate-limit 30/min IP + 60/min clave gratis.
- **Checklist adaptable:**
  - [ ] En `diagnose/route.ts`, `audit/route.ts`, `repair/route.ts`, `hooks/route.ts`: importar `requireCrmAuth` y usarlo al inicio.
  - [ ] Borrar el `apiKey !== process.env.CRM_API_KEY` de las 4.
  - [ ] Test: 50 `POST` con key inválida → 429 tras el 31º (`tests/integration/agents-auth.test.ts`).
  - [ ] Test: key válida → 200; key ausente → 401.

**DEFECTO-013 — `repair` idempotente + dry-run por defecto**

- **Acción:** exigir `x-dry-run: true` (o body `dryRun`) para mutar en prod, y registrar traza del cambio (quién/disagnóstico) en `activity`.
- **Checklist:** [ ] default `dryRun` salvo flag explícito · [ ] crear `Activity` "Reparador: stage→X" en cada mutación · [ ] test de reenvío no mueve el stage dos veces si ya está en target.

**DEFECTO-014 — Gate de CI en `moderate` + secret-scan + SAST**

- **Acción:** `pnpm up postcss` y bajar `--audit-level=high` → `moderate`; añadir step `gitleaks`/`semgrep`.
- **Checklist:** [ ] `pnpm audit --audit-level=moderate` en CI · [ ] `gitleaks detect` step · [ ] `semgrep scan --config auto` step (o `osv-scanner`).

**DEFECTO-015 — Pinnear actions a SHA**

- **Acción:** `actions/checkout@v4` → `actions/checkout@<40-char SHA>` (ídem setup-node, cache, etc.) en `ci.yml` y `docs/ci-improvements/ci.yml`.
- **Checklist:** [ ] Reemplazar los 12 `uses: ...@vN` por SHA · [ ] verificar que el build sigue verde.

**DEFECTO-019 — Subir `--text-tertiary` / `--text-muted` a AA**

- **Acción:** en `design-tokens.css` light, `--text-tertiary` de `210 12% 50%` → `210 14% 40%` (4.6:1) y `--text-muted` de `213 15% 63%` → `213 15% 50%` (4.5:1).
- **Checklist:** [ ] Editar tokens light · [ ] re-correr axe en las 4 páginas → 0 color-contrast · [ ] revisar modo dark sigue ≥4.5:1 (ya 4.7:1, ok).

**DEFECTO-020 — Heading order en `/proyectos`**

- **Acción:** cambiar `ak-tile-title` de `h3` a `h2` o mover el `<h1>` antes de las tarjetas; o usar `div` con `role` si no es heading semántico.
- **Checklist:** [ ] axe `heading-order` → 0 en `/proyectos`.

**DEFECTO-016/017 — Higiene**

- **Acción:** borrar `website-contenido-pendiente.md` (o mover a `docs/`), limpiar exports muertos confirmados por knip.
- **Checklist:** [ ] `rm website-contenido-pendiente.md` · [ ] eliminar `CONFIRM_TOKEN_TTL_MS` y los `*Schema`/`*Context` sin uso · [ ] `pnpm knip` tras limpieza.

**DEFECTO-018 — Tests de auth de agentes**

- **Acción:** añadir `tests/integration/agents-auth.test.ts` cubriendo fuerza bruta (429), key ausente (401), key válida (200).
- **Checklist:** [ ] caso 50 intentos → 429 · [ ] caso key mala → 401 · [ ] caso ok → 200.

**Tabla de priorización**

| Orden | Defecto(s)                | Severidad | Esfuerzo | Tipo                              |
| ----- | ------------------------- | --------- | -------- | --------------------------------- |
| 1     | DEFECTO-012               | GRAVE     | Bajo     | 🔥 Apagar incendio (auth agentes) |
| 2     | DEFECTO-019               | MODERADO  | Trivial  | Quick win (AA contraste)          |
| 3     | DEFECTO-013 + DEFECTO-018 | MODERADO  | Bajo     | Endurecer (repair + tests)        |
| 4     | DEFECTO-014 + DEFECTO-015 | MODERADO  | Bajo     | Proceso/CI                        |
| 5     | DEFECTO-020               | MICRO     | Trivial  | Quick win (a11y heading)          |
| 6     | DEFECTO-016 + DEFECTO-017 | MICRO     | Bajo     | Higiene                           |

---

## 3. PLAN ANEXO DE MAGNIFICACIÓN

### MEJORA-01 — Auth unificada por middleware, no por ruta

- **Objetivo:** que ninguna ruta nueva pueda olvidar auth. Mover `requireCrmAuth` a un `middleware.ts` (o wrapper `withCrmAuth(handler)`) que cubra `/api/crm/*`, `/api/newsletter/send` y `/api/agents/*` por config.
- **Beneficios:** elimina la clase de error DEFECTO-012 para siempre; un solo lugar que auditar.

### MEJORA-02 — Contraste auditado en CI (axe en el pipeline)

- **Objetivo:** meter `axe-core/playwright` en el job `e2e` para que el 3.8:1 de `--text-tertiary` falle el build.
- **Beneficios:** la a11y deja de depender de que un humano corra Lighthouse.

### MEJORA-03 — Observabilidad de negocio sobre el OTel ya cableado

- **Objetivo:** spans con `lead.persisted`, `order.persisted`, `agent.repair.applied` → alerta SigNoz sobre tasa de fallo > 0.
- **Beneficios:** detectar en segundos un agente moviendo stages por error, no por reclamación.

### MEJORA-04 — Tests de mutación sobre la lógica crítica

- **Objetivo:** Stryker sobre `lib/crm-auth`, `lib/agents/*`, `app/api/*`.
- **Beneficios:** confianza real, no porcentaje cosmético (el DEFECTO-018 es un mutante vivo).

---

## RESUMEN EJECUTIVO (para decisores)

El repo pasó de "limpio" a "serio": cerró la ruta del dinero (webhook 500), blindó el CRM (timing-safe auth + rate-limit) e hizo double opt-in. Pero la incorporación del módulo de agentes LLM **introdujo una regresión de seguridad GRAVE** — 4 rutas que mutan negocio con auth de pega (`!==` + sin rate-limit) — y el front salió a producción con texto que no llega a AA (3.8:1). Nada catastrófico, pero el orden 1 de la tabla (DEFECTO-012) es un parche de 4 líneas que no tiene excusa; el 2 (contraste) es una línea de token. Con media jornada de trabajo el sitio vuelve a ser referencia del sector en las 16 categorías.

---

## TABLA RESUMEN

| Severidad    | Confirmados | Sospechas | Total                          |
| ------------ | ----------- | --------- | ------------------------------ |
| CATASTRÓFICO | 0           | 0         | 0                              |
| GRAVE        | 1           | 0         | 1                              |
| MODERADO     | 8           | 0         | 8                              |
| MICROSCÓPICO | 4           | 0         | 4                              |
| **TOTAL**    | **13**      | **0**     | **13 (+14 previos resueltos)** |

Nuevos defectos de esta auditoría: DEFECTO-012 a DEFECTO-020 (12). La numeración continúa la anterior (que terminaba en DEFECTO-011).

---

## COMPARACIÓN CON AUDITORÍA PREVIA

> Auditoría anterior: commit `ad4288a`, fecha 2026-07-01.

| Métrica       | Antes  | Ahora  | Δ             |
| ------------- | ------ | ------ | ------------- |
| CATASTRÓFICOS | 0      | 0      | —             |
| GRAVES        | 1      | 1      | — (distinto)  |
| MODERADOS     | 7      | 7      | — (distintos) |
| MICROSCÓPICOS | 3      | 4      | +1            |
| **TOTAL**     | **11** | **12** | **+1**        |

**Nuevos desde la última auditoría:** DEFECTO-012 (auth agentes, GRAVE), DEFECTO-013 (repair no idempotente), DEFECTO-014 (gate CI moderate), DEFECTO-015 (action tags mutables), DEFECTO-016 (knip dead code), DEFECTO-017 (md suelto), DEFECTO-018 (sin tests auth agentes), DEFECTO-019 (contraste AA), DEFECTO-020 (heading order).

**Resueltos:** DEFECTO-001 (webhook 500), DEFECTO-002 (IP trust), DEFECTO-003 (rate-limit sweep), DEFECTO-004 (contacto 502 honesto), DEFECTO-005 (double opt-in), DEFECTO-007 (JSON-LD escape), DEFECTO-008/009/010/011 (higiene: `_shot.mjs` borrado, `.claude/worktrees/` en gitignore, tests de fallo de webhook, `engines` añadido, `key={i}` 10→5).

**Persistentes (reincidentes en espíritu):** DEFECTO-006 → sigue como DEFECTO-014 (gate de audit sigue ciego a moderadas; ahora 3 moderate reales). El _patrón_ de "la nueva superficie se olvida del estándar de seguridad existente" volvió en DEFECTO-012.

**Nota de severidad:** el GRAVE de antes (ruta del dinero) se cerró; el GRAVE de ahora (auth agentes) es de la misma familia — superficie nueva que no hereda el control de la vieja.

---

## MÉTRICAS DE LA AUDITORÍA

| Métrica                                | Valor                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Tiempo total                           | ~95 min                                                                                                   |
| Nivel de profundidad                   | 3-PROFUNDO                                                                                                |
| Modo de objetivo                       | COMBINADO (repo + sitio)                                                                                  |
| Modo de entorno                        | COMPLETO                                                                                                  |
| Herramientas ejecutadas                | 13 de 16 (trivy/scc/bandit no aplican: sin Dockerfile/Python)                                             |
| Hallazgos brutos de herramientas       | gitleaks 0 · semgrep 14 · knip 35 · jscpd 28 · axe 5 · LH 4 cat                                           |
| Falsos positivos filtrados             | 4 (CORS `*` descartado, unsafe-formatstring descartado, GPL knip descartado, semgrep INFO)                |
| Defectos finales                       | 13 (13 confirmados, 0 sospechas)                                                                          |
| Defectos sistémicos                    | 3 de N instancias (DEFECTO-012 en 4 rutas, DEFECTO-019 en 4 páginas/78+ nodos, DEFECTO-015 en 12 actions) |
| Categoría más castigada                | 1.3 / 2.3 — Seguridad observable + Accesibilidad                                                          |
| Archivos/páginas auditados manualmente | 38 de 267 ficheros + 4 páginas live (Prioridad: API routes, tokens, agents, CRM)                          |
| Commit auditado                        | `651f51c` (`feat/restructure-content`)                                                                    |

---

---

## 4. ANEXO — RENDIMIENTO MÓVIL + GALERÍA VISUAL DE INTERACCIONES

Ampliación de la auditoría (PROFUNDO, segunda pasada) para cubrir **rendimiento en móvil real** y **render visual de UI con todas las interacciones de puntero** (hover, click, focus, menú, cambio de tema), capturadas con Playwright/Chromium y medidas con Lighthouse en form-factor móvil + throttling de red. 42 capturas en `AUDITORIA-CRITICA.md` (ver galería al final de esta sección).

### 4.1 Rendimiento móvil (Lighthouse, form-factor móvil)

| Métrica           | Móvil (throttled) | Desktop (previo) |
| ----------------- | ----------------- | ---------------- |
| Performance       | **100**           | 100              |
| Accessibility     | **92**            | 92               |
| Best Practices    | **100**           | 100              |
| SEO               | **100**           | 100              |
| FCP               | 1.3 s             | 0.3 s            |
| LCP               | 1.3 s             | 0.4 s            |
| TBT               | 0 ms              | 0 ms             |
| CLS               | **0**             | 0.008            |
| Speed Index       | 1.5 s             | 1.0 s            |
| TTFB (root doc)   | 31 ms             | 30 ms            |
| Main-thread work  | 1.5 s             | —                |
| Requests (Script) | 13                | —                |

**Veredicto móvil:** el Ferrari sigue siendo Ferrari en el bolsillo. 100/100/100/92 con CLS 0 impecable y FCP/LCP de 1.3 s sobre red throttled. El SSG + `next/image` + cero JS bloqueante aguanta el móvil tan bien como el escritorio. **No hay defecto de rendimiento móvil.**

### 4.2 DEFECTO-021 — Scroll horizontal en móvil: `.ak-cta-form` (max-width 420px) más ancho que el viewport de 390px · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/styles/site.css:130` (`.ak-cta-form { display:flex; gap:10px; max-width:420px; margin:0 auto; }`).
- **Evidencia:** en viewport móvil real (390×844, `isMobile`), `document.body.scrollWidth = 571` frente a `window.innerWidth = 390` → **overflow de 181px** que fuerza scroll horizontal. El culpable medido por `getBoundingClientRect`: `.ak-cta-form` renderiza a **420px de ancho** (supera los 390px del teléfono), arrastrando el botón `.ak-btn-primary` (right=472) y `.ak-form-legal` (right=571) fuera de pantalla. No existe media query que reduzca el `max-width` en móvil.
- **El crimen:** un formulario de captación de leads — justo el CTA comercial que la reestructuración F0→F18 persigue — que se sale de la pantalla en el iPhone más común (390px). El usuario móvil tiene que hacer scroll lateral para ver el botón "Enviar". Es el opuesto a "código que es tuyo y conversión pensada para pequeñas empresas".
- **Por qué arde:** es sistemático en móvil (no depende de contenido), afecta a la home y a cualquier página con `.ak-cta-form`, y la cura es de una línea: `max-width: min(420px, 100%)` + `padding-inline` en el contenedor.
- **Nota:** las tarjetas de testimonios (`ak-tcard`) aparecían como ofensores a right=583, pero están dentro de `.ak-tcar-viewport { overflow:hidden }` (línea 339) — el carrusel las recorta, **no** causan scroll. Descartado como falso positivo.
- **Categoría:** 2.6 / 1.4

### 4.3 Comportamiento de puntero verificado (hover / click / focus)

Medido por computed-style en escritorio y móvil (Playwright), no inferido de capturas:

- **`.ak-btn-primary:hover`** (`site.css:13`): `filter: brightness(1.1)` + `transform: translateY(-1px)` + `box-shadow`. ✔ Feedback de hover **presente** (el check previo que leía `backgroundColor` daba "static" por error de métrica; el sitio SÍ responde al hover).
- **`.ak-nav a:hover`** (`site.css:32`): color secundario → primario. ✔
- **`.ak-pcard:hover`** (`site.css:85`): `translateY(-4px)` + `elev-lg`. ✔ Transforma al hover (confirmado por `getComputedStyle().transform` antes/después).
- **`.ak-theme-toggle` click**: alterna `dark`/`light` (capturado en `*-dark.png`); el `prefers-color-scheme` + clase `.dark` aplican tokens correctos.
- **`.ak-burger` (móvil)**: visible a ≤880px, abre `.ak-mobile-nav` (377px alto, 8 enlaces, `display:flex`). ✔ Menú hamburguesa funcional.
- **Tap targets móvil**: el `.ak-theme-toggle` (38×38) y `.ak-burger` (38×38) rozan el mínimo WCAG de 44px; los enlaces de nav (17px de alto) y `.ak-logo` están por debajo de 44px pero son inline-text, tolerable. Sin bloqueo, pero el toggle/burger podrían ir a 44×44.

**Hallazgo visual honesto:** las 3 capturas `*-menu-open.png` de la primera pasada (script `capture.mjs`) se generaron con un `try/catch` que enmascaró un fallo de estabilidad de click de Playwright → **el menú no estaba realmente abierto** en esas imágenes. Se regeneraron correctamente en `mobile-home-menu-open-real.png`. Las demás interacciones (hover, dark, card-click→detail, focus, validation) sí se capturaron con estado real.

### 4.4 Galería de capturas (42 imágenes, `AUDITORIA-CRITICA.md` / `.audit-shots/`)

**Formato de archivo:** `{dispositivo}-{pagina}-{estado}.png`. `desktop` = 1440×900, `mobile` = 390×844@3x (1170×2532).

| Captura                                              | Qué demuestra                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `desktop-home-fold` / `-full`                        | Hero + terminal + servicios + proyectos en escritorio                        |
| `desktop-home-dark`                                  | Modo oscuro (toggle click)                                                   |
| `desktop-home-hover-contacto`                        | Hover del botón Contacto (lift+brightness)                                   |
| `desktop-proyectos-card-hover`                       | Hover de tarjeta de proyecto (translateY -4px)                               |
| `desktop-proyectos-detail` / `-full`                 | Navegación click → `/proyectos/[slug]` (RSC)                                 |
| `desktop-contacto-focus`                             | Focus en input email (ring de foco)                                          |
| `desktop-contacto-validation`                        | Click en Enviar vacío → errores de validación zod                            |
| `mobile-home-fold` / `-full`                         | Layout móvil (burger visible, nav oculta)                                    |
| `mobile-home-dark`                                   | Modo oscuro móvil                                                            |
| `mobile-home-menu-open-real`                         | **Menú hamburguesa abierto** (8 enlaces, 377px) — DEFECTO-021 visible en CTA |
| `mobile-home-cta-bottom`                             | CTA-form desbordando el viewport (scroll horizontal)                         |
| `mobile-contacto-focus` / `-validation`              | Form móvil: focus + validación                                               |
| `mobile-proyectos-fold` / `-card-hover` / `-detail`  | Proyectos móvil + hover + detalle                                            |
| `mobile-servicios-*` / `mobile-proyectos-*` (varias) | Resto de páginas en móvil                                                    |

**Para visualizar:** las imágenes están en `.audit-shots/` (42 PNG). Se generaron con `capture.mjs` + `capture-extra.mjs` (Playwright). No se incrustan inline para no inflar el informe; el revisor las abre en el repo.

---

### Reproducir esta auditoría

```bash
cd ~/projects/website-alexendrosdev
gitleaks detect --source . --no-banner -r /tmp/gitleaks.json
semgrep scan --config auto --json --output /tmp/semgrep.json .
npx tsc --noEmit --pretty false
npx eslint .
npx prettier --check $(git ls-files '*.ts' '*.tsx' '*.mjs' '*.css' '*.md' '*.mdx')
pnpm audit --audit-level=moderate
npx knip
npx jscpd src
pnpm build
npx lighthouse https://alexendros.dev --only-categories=performance,accessibility,best-practices,seo --preset=desktop --output=json
# axe (desde el repo, con @playwright/test): ver script axe.mjs en el informe
curl -sI https://alexendros.dev ; curl -s https://alexendros.dev/robots.txt ; curl -s https://alexendros.dev/sitemap.xml
```

### Rama de remediación sugerida

`fix/auditoria-02` → atacar en el orden de la tabla de priorización; un commit atómico por defecto, corriendo `pnpm test` + `npx knip` + re-axe tras cada uno. El DEFECTO-012 va primero y es el único bloqueante para merge de la rama `feat/restructure-content`.
