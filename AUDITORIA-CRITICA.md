# AUDITORÍA CRÍTICA — website-alexendrosdev

> **Veredicto:** llamarlo «infame» es difamación; es de los repos más limpios que pasan por esta sala de autopsias — pero la ruta del dinero esconde un fallo silencioso que cobra y pierde el pedido sin pestañear.

**Resumen ejecutivo.** Portfolio Next.js 16 fullstack con backend de pagos, leads y newsletter: TypeScript estricto sin un solo `any`, 101 tests verdes, gate de cobertura real (93/86/95/92), sin secretos filtrados (gitleaks limpio en 73 commits), sin dependencias circulares, duplicación del 1,03 %, webhook de Stripe con firma verificada y precio resuelto en servidor. El cimiento aguanta de sobra. Los incendios reales son tres y todos viven en el mismo pecado de diseño: **tragarse los errores y devolver éxito**. El más grave —`DEFECTO-001`— hace que un pago cobrado por Stripe se pierda sin reintento si la BD parpadea en ese instante. Lo demás es higiene de proceso (rate-limit spoofeable y con fuga de memoria, deps transitivas con CVE sin gate en CI) y polvo cosmético. No hay nada catastrófico; hay un repo a un día de trabajo de ser irreprochable.

**Alcance auditado.** `~/repositorios/personal/website-alexendrosdev`, working tree en `ad4288a` (rama `main`), 166 ficheros versionados, ~4.780 LOC en `src/` (63 `.ts`, 50 `.tsx`, 3 `.css`, 3 `.mdx`). Stack: Next.js 16.2.6 (App Router/Turbopack) · React 19.2 · TS estricto · Tailwind v4 · Prisma 7 (Postgres/Supabase) · Stripe · Resend · zod v4 · Vitest 4 + Playwright.

**Herramientas ejecutadas.** `tsc --noEmit` (0 errores) · `eslint` (0 errores, 1 warning) · `prettier --check` · `pnpm audit` (11 advisories) · `gitleaks detect` (limpio) · `madge --circular` (0) · `knip` · `ts-prune` · `jscpd` (1,03 %) · `vitest run` (101/101). No se ejecutó `next build` ni la suite `e2e`/Lighthouse en esta pasada (sin impacto en los hallazgos: son de lógica y proceso, no de render). `semgrep`/`osv-scanner` no corridos; sus vectores (firma de webhook, inyección, secretos en bundle, CVE) se auditaron a mano y con `pnpm audit`/`gitleaks`.

---

## 1. INFORME DE CRÍTICA DESTRUCTIVA

### 1.1 Arquitectura y Diseño

Casi insultantemente correcta. Frontera cliente/servidor explícita (RSC por defecto, islas `"use client"` contadas, `import "server-only"` en los módulos de datos), contenido tipado como fuente de verdad sin CMS, degradación null-safe coherente en `db`/`email`/`stripe`, precio de checkout resuelto **en servidor** desde un catálogo tipado. `madge` no encuentra una sola dependencia circular en 75 ficheros. No hay capa que se salte otra, ni clase-Dios, ni controlador con lógica de negocio incrustada. El único reproche estructural cae en 1.2: el patrón de degradación se confunde con «tragar fallos de runtime», y eso no es lo mismo.

> Milagrosamente, la arquitectura no es un castillo de naipes: alguien aquí sabía dónde poner cada frontera. Disfrútalo.

### 1.2 Implementación y Lógica

Aquí está el único defecto que de verdad merece perder el sueño.

### DEFECTO-001 — El webhook que cobra el pago y tira el pedido a la basura sonriendo · `GRAVE` · `CONFIRMADO`

- **Ubicación:** `src/app/api/stripe/webhook/route.ts:L34-L56`
- **Evidencia:** en `checkout.session.completed`, `prisma.order.upsert(...)` está envuelto en `try { … } catch (err) { console.error(...) }` y, pase lo que pase, la función cae al `return NextResponse.json({ received: true })` final (L56) con HTTP 200. El test `tests/integration/stripe-webhook.test.ts` cubre firma ausente/inválida y `prisma === null`, pero **no existe** ningún caso en que `upsert` lance: el fallo de persistencia jamás se ejercita.
- **El crimen:** Stripe interpreta `200` como «recibido y procesado» y **no reintenta**. Si Postgres está caído, en pool exhaustion o con un deadlock en el milisegundo en que llega el webhook, el `catch` escribe una línea de log, devuelve 200, y Stripe da el evento por bueno para siempre. El dinero entró; el `Order` no existe; nadie se entera hasta que el cliente reclama el servicio que pagó.
- **Por qué arde:** es la ruta del dinero perdiendo datos en silencio. No es un 500 ruidoso que alguien ve en el dashboard: es una fuga invisible que solo se detecta por reconciliación manual contra Stripe, que es justo lo que un webhook debería evitar. La cura es de una línea de criterio: si la persistencia falla, devolver 500 y dejar que Stripe reintente (su backoff está diseñado para esto).
- **Categoría:** 1.2

### DEFECTO-004 — Formularios que dicen «¡recibido!» mientras el lead se evapora · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/app/api/contact/route.ts:L35-L76` y `src/app/api/newsletter/route.ts:L34-L66`
- **Evidencia:** ambos handlers envuelven `prisma.*.create/upsert` y `resend.emails.send` en `try/catch` que solo loguean, y terminan incondicionalmente en `return NextResponse.json({ ok: true })`. Si la BD lanza y el email lanza, el usuario recibe `{ ok: true }` igual.
- **El crimen:** misma filosofía que DEFECTO-001 pero fuera de la caja registradora. El visitante cree que su mensaje llegó; en realidad se perdió entre dos `console.error` que nadie está mirando. Para un portfolio cuyo objetivo _es_ captar clientes, perder un lead en silencio es perder exactamente aquello para lo que existe el sitio.
- **Por qué arde:** no corrompe datos ni cobra de más, pero degrada el activo de negocio (el lead) sin señal alguna. Al menos cuando ambos canales fallan debería devolver un error honesto para que el front ofrezca un email directo de fallback.
- **Categoría:** 1.2

El resto de la lógica es sólida: `flattenErrors` deduplica por campo correctamente, el `safeParse` precede a todo acceso, los `await req.json()` están protegidos con `try/catch`→400, el `upsert` por `stripeSessionId` hace el webhook idempotente, y el `useEffect` del `Terminal` limpia **todos** sus timers en el cleanup (`timers.forEach(clearTimeout)`) con dependencias honestas. Nada de promesas huérfanas, `await` olvidados ni `catch {}` vacíos.

### 1.3 Vulnerabilidades de Seguridad

Sin sangre catastrófica. El webhook de Stripe **sí** verifica firma (`stripe.webhooks.constructEvent`, L26) leyendo el cuerpo crudo (`req.text()`) — el crimen de manual no está cometido. Cero secretos en el repo, cero `NEXT_PUBLIC_*` sensible (la única es `BASE_URL`, que es pública por definición). Pero hay grietas:

### DEFECTO-002 — Rate-limit que se desactiva con una cabecera que escribe el atacante · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/lib/rate-limit.ts:L21-L25` (consumido en las tres rutas API)
- **Evidencia:** `clientIp` hace `headers.get("x-forwarded-for")?.split(",")[0]` — toma el **primer** valor de una cabecera que el cliente controla por completo. No hay lista de proxies de confianza ni se usa una fuente fiable (en Vercel sería la IP que inyecta su edge).
- **El crimen:** el limitador clavea por `contact:${ip}`. Como el atacante decide qué `X-Forwarded-For` manda, cada petición puede llevar una IP distinta y el `Map` nunca ve dos hits de la «misma» IP. El rate-limit pasa de defensa a placebo con una línea de `curl`.
- **Por qué arde:** habilita fuerza bruta de los endpoints y, combinado con DEFECTO-005, convierte la newsletter en un relay de spam. En despliegue Vercel el riesgo baja (su proxy reescribe la cabecera), pero el código se documenta a sí mismo para «VPS» y ahí la cabecera es del cliente.
- **Categoría:** 1.3

### DEFECTO-005 — Newsletter sin doble opt-in: máquina de spam con membrete ajeno · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/app/api/newsletter/route.ts:L46-L57`
- **Evidencia:** ante cualquier email válido se dispara `resend.emails.send` con `WelcomeEmail` a esa dirección, sin paso de confirmación. La única barrera es el rate-limit de 5/min por IP, neutralizable vía DEFECTO-002.
- **El crimen:** escribo el email de una víctima, tu servidor le manda «Gracias por suscribirte» desde tu dominio. Repetido, es mail-bombing con tu reputación de envío como munición y tu factura de Resend como daño colateral.
- **Por qué arde:** quema la reputación del dominio (SPF/DKIM marcados como fuente de no solicitado), consume cuota de Resend y expone a abuso de terceros. Double opt-in (token de confirmación) lo corta de raíz.
- **Categoría:** 1.3

### DEFECTO-007 — JSON-LD inyectado sin escapar `<`: XSS latente a la espera de un `</script>` · `MODERADO` · `SOSPECHA`

- **Ubicación:** `src/components/JsonLd.tsx:L3`
- **Evidencia:** `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}`. `JSON.stringify` no escapa `<`; si cualquier campo serializado contuviera la secuencia `</script>`, cerraría la etiqueta y abriría inyección. Hoy `data` proviene del catálogo interno tipado (`schema-dts`), de ahí «SOSPECHA»: no explotable con el contenido actual, pero a una entrada de blog con `</script>` en el título de distancia.
- **El crimen:** el patrón inseguro canónico de incrustar JSON en `<script>`. Funciona hasta que el contenido deja de ser 100 % de confianza.
- **Por qué arde:** defensa en profundidad ausente en un sumidero de HTML. La cura es trivial: `.replace(/</g, "\\u003c")` sobre el string serializado.
- **Categoría:** 1.3

> Los otros dos `dangerouslySetInnerHTML` (`layout.tsx:L68` script de tema, `Terminal.tsx:L78`) operan sobre **constantes hardcodeadas** en el propio fichero (`themeScript`, `TERMINAL_LINES as const`). Sin entrada externa, sin vector. Absueltos.

### DEFECTO-006 — Once CVE en dependencias transitivas y una CI que mira para otro lado · `MODERADO` · `CONFIRMADO`

- **Ubicación:** árbol de dependencias (`pnpm-lock.yaml`) y `.github/workflows/ci.yml`
- **Evidencia:** `pnpm audit` → 11 advisories (2 HIGH, 9 moderate). Las 2 HIGH son `vite` (`server.fs.deny` bypass, **dev-only**) y `hono` (CORS refleja cualquier Origin con credenciales) que entra **vía `@prisma/client > prisma > @prisma/dev`** — herramienta de desarrollo de Prisma, no runtime de producción. `postcss <8.5.10` (XSS, moderate) sí es transitiva de `next`. El `ci.yml` corre `format:check→lint→typecheck→test:coverage→build` pero **ningún** `pnpm audit` ni escaneo de secretos.
- **El crimen:** ninguna de las HIGH es explotable en el producto desplegado (son cadena de tooling/dev), pero entran sin que nadie las vea porque la CI no audita dependencias. La deuda se acumula a oscuras.
- **Por qué arde:** hoy es ruido de severidad real baja; el problema es de proceso: sin gate, la primera CVE que _sí_ toque runtime pasará igual de desapercibida. `pnpm up` puntual + step de `audit` en CI lo zanja.
- **Categoría:** 1.3 / 1.5

### 1.4 Rendimiento y Escalabilidad

### DEFECTO-003 — Rate limiter con fuga de memoria: el `Map` que nunca olvida una IP · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `src/lib/rate-limit.ts:L6-L18`
- **Evidencia:** `const hits = new Map<string, number[]>()`. Las marcas viejas de una clave se filtran **solo cuando esa misma clave vuelve a consultarse** (L10). Las claves de IPs que pegan una vez y no vuelven jamás se eliminan: quedan en el `Map` con su array para siempre. No hay barrido, ni TTL, ni `setInterval` de limpieza.
- **El crimen:** en el escenario «instancia única / VPS» que el propio comentario describe (proceso de larga vida), cada IP única deja un residuo permanente. Con DEFECTO-002 (IPs spoofeadas e ilimitadas), un atacante puede inflar el `Map` a voluntad → crecimiento de heap no acotado.
- **Por qué arde:** OOM lento pero seguro en long-running; vector de DoS por agotamiento de memoria cuando se combina con el spoofing. En serverless (Vercel) el reciclado de instancias lo enmascara, pero el código apunta explícitamente a VPS. Purga periódica de claves vacías o `lru-cache` con `maxSize`/`ttl` lo resuelve.
- **Categoría:** 1.4

Por lo demás, nada de N+1 (los Server Components leen de catálogos en memoria, no de la BD en bucle), sin algoritmos de juguete, sin `<img>` crudos (cero en `src/`), sin fetch en cascada evitable. Para el tamaño actual, rinde de sobra.

### 1.5 Deuda Técnica y Malas Prácticas

Sorprendentemente poca, y casi toda intencional/documentada.

### DEFECTO-008 — Cadáveres menores: script huérfano y exports que no exporta nadie · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** `_shot.mjs` (raíz, sin referencia en `package.json`); exports/types sin consumir reportados por `knip`: `CaseSection` (`src/lib/content/case-studies.ts:16`), `Metric`/`Feature` (`src/lib/content/types.ts:3,79`), `ContactInput`/`NewsletterInput`/`CheckoutInput` (`src/lib/validation.ts:26,33,42`).
- **Evidencia:** `knip` (acotado, descontando worktrees): «Unused files», «Unused exports (24)», «Unused exported types (33)» — la mayoría falsos positivos de Next (defaults de página, `metadata`, `register`, emails consumidos por Resend), pero los citados son reales.
- **El crimen:** `_shot.mjs` es un script de captura suelto sin dueño; los `*Input` types son `z.infer` que nadie importa (se infiere en el punto de uso).
- **Por qué arde:** no arde, hiede levemente. Borrar o documentar.
- **Categoría:** 1.5

Los **30 `TODO:`** en `src/lib/content/` (precios a confirmar, métricas, testimonios reales, `years` de stack) **no son deuda fosilizada**: son marcadores deliberados de datos pendientes de un portfolio en construcción, documentados en `CLAUDE.md`/`ROADMAP.md`. No cuentan como crimen; sí conviene un issue que los rastree para que no se queden en producción.

### DEFECTO-009 — `.claude/worktrees/` fuera de `.gitignore`: las herramientas de análisis tragan ruido · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** `.gitignore` (ausencia de `.claude/worktrees/`)
- **Evidencia:** `grep worktree .gitignore` → vacío. `knip` reportó **548 «unused files»** y `prettier --check` **66 ficheros**, casi todos dentro de `.claude/worktrees/agent-*` (worktrees de otros agentes, incluido `.next/` compilado). Git no los versiona (los excluye por ser worktrees registrados), pero las herramientas que escanean el árbol de ficheros sin conciencia de git sí los devoran.
- **El crimen:** envenena cualquier auditoría automática y dispara falsos positivos masivos.
- **Por qué arde:** higiene de tooling; añadir `.claude/worktrees/` a `.gitignore` y/o a los `ignore` de knip/prettier limpia el ruido.
- **Categoría:** 1.5

### 1.6 Documentación y Legibilidad

De referencia. `CLAUDE.md` raíz es un mapa arquitectónico denso y honesto (hasta avisa de que `ARCHITECTURE.md` describe el árbol _objetivo_, no el real, y manda el código). `README`, `ROADMAP`, `tests/README.md`, `.env.example` exhaustivamente comentado. Los comentarios del código explican el **porqué** (degradación null-safe, runtime nodejs del webhook, fuente de verdad del precio), no el qué obvio. Único matiz: el `CLAUDE.md` del working tree está sin formatear (Prettier lo marca), pero es trabajo en curso sin commitear. Sin reproche real.

### 1.7 Pruebas y Cobertura

101 tests en 22 ficheros, verdes en 1,88 s, con un gate de cobertura que **bloquea merge** (statements 93 / branches 86 / functions 95 / lines 92) y cinco capas (unit, integración, componente, e2e Playwright, a11y axe). Esto es lo que la mayoría de repos _fingen_ tener. Dos lagunas concretas, ambas ligadas a los defectos de arriba:

### DEFECTO-010 — La rama de fallo de la ruta del dinero no se testea · `MODERADO` · `CONFIRMADO`

- **Ubicación:** `tests/integration/stripe-webhook.test.ts` (y análogos contact/newsletter)
- **Evidencia:** el test del webhook cubre `prisma === null` pero nunca `orderUpsert.mockRejectedValue(...)`. El branch del `catch` de persistencia (L48-L50 del handler) está sin ejercitar — la cobertura del 86 % de ramas pasa _alrededor_ del agujero, no a través de él.
- **El crimen:** justo la línea que esconde DEFECTO-001 es la que ningún test cuestiona. La cobertura alta da una falsa sensación de seguridad sobre la ruta crítica.
- **Por qué arde:** cuando se arregle DEFECTO-001 (devolver 500 al fallar), hace falta el test que lo fije; hoy ni siquiera documenta el comportamiento actual.
- **Categoría:** 1.7

### 1.8 Errores Microscópicos y Estilo

Prácticamente estéril. ESLint: **0 errores**, 1 warning (`scripts/audit-lighthouse.mjs:221`, variable `_` sin usar). Cero `any`, cero `@ts-ignore`, cero `console.log` en `src/` (solo `console.error/warn` deliberados en handlers). Prettier limpio sobre lo versionado. Polvo agrupable:

### DEFECTO-011 — `key={i}` por índice en listas (lote) · `MICROSCÓPICO` · `CONFIRMADO`

- **Ubicación:** 10 instancias — representativas: `src/components/sections/contact/ContactView.tsx:358,367`, `src/app/sobre-mi/page.tsx:59,83`, `src/components/sections/services/ServicesView.tsx:99,121`, `src/components/sections/stack/StackGraph.tsx:162`, `Marquee.tsx:11`, `Terminal.tsx:77`, `proyectos/[slug]/page.tsx:145`.
- **Evidencia:** `grep -rnE "key=\{(idx|i|index)\}"`.
- **El crimen:** `key` por índice. En estas listas el contenido es estático y no se reordena, así que hoy es inocuo; el riesgo aparece si alguna se vuelve filtrable/ordenable (p. ej. la rejilla de proyectos) y React reconcilia por posición.
- **Por qué arde:** no arde aún; usar un id estable donde el dato lo tenga elimina la trampa futura.
- **Categoría:** 1.8

Detalles sueltos sin bloque propio: falta `engines` en `package.json` (la CI fija Node 22 pero el repo no lo declara → un dev con otra versión puede sorprenderse); `validation.ts:L15` acepta `type` como string libre (`max(60)`) en vez de un `z.enum` de los tipos de contacto reales (validación laxa, no peligrosa).

---

## 2. PLAN DE SANEAMIENTO CON CHECKLIST ADAPTABLE

**DEFECTO-001 — Que el webhook reintente cuando la BD falla**

- **Acción:** en el `catch` de la persistencia, dejar de devolver 200. Responder 500 para que Stripe reintente con su backoff; el `upsert` idempotente por `stripeSessionId` garantiza que el reintento no duplica.
- **Checklist adaptable:**
  - [ ] En `webhook/route.ts`, mover el `return { received: true }` para que **solo** se alcance tras persistencia exitosa (o sin `prisma`, que es degradación intencional).
  - [ ] En el `catch` del `upsert`: `return NextResponse.json({ error: "persist" }, { status: 500 })`.
  - [ ] Mantener 200 en el caso `prisma === null` (degradación documentada, no es fallo).
  - [ ] Considerar una DLQ/tabla `webhook_events` para eventos no procesables tras N reintentos.
  - [ ] Test: `orderUpsert.mockRejectedValue(new Error("db down"))` → espera 500 (cierra DEFECTO-010).

**DEFECTO-004 — Errores honestos en contact/newsletter**

- **Acción:** distinguir «degradación sin credenciales» (200/ok intencional) de «fallo de runtime» (la BD/Resend lanzó). En el segundo caso, devolver 5xx para que el front ofrezca fallback.
- **Checklist adaptable:**
  - [ ] Capturar si **ambos** canales fallaron por excepción (no por ausencia de cliente) → 502/503 con mensaje accionable.
  - [ ] El front muestra «no pudimos registrar tu mensaje, escríbeme a <email>» en ese 5xx.
  - [ ] Tests de la rama de excepción para contact y newsletter.

**DEFECTO-002 + DEFECTO-003 — Rate-limit fiable y sin fugas**

- **Acción:** derivar la IP de una fuente de confianza y acotar la memoria del limitador.
- **Checklist adaptable:**
  - [ ] En Vercel, usar la IP que inyecta el edge (no el primer `X-Forwarded-For` arbitrario); si hay proxy propio, fijar nº de saltos de confianza y tomar la IP por índice conocido.
  - [ ] Sustituir el `Map` artesanal por `lru-cache` con `max` y `ttl`, o añadir un barrido periódico que elimine claves con array vacío.
  - [ ] Si se va a multi-instancia, migrar a Upstash/Redis (ya anticipado en el comentario).
  - [ ] Test de carga sintético: N IPs únicas no deben crecer el heap sin cota.

**DEFECTO-005 — Double opt-in en newsletter**

- **Acción:** no enviar bienvenida hasta confirmar la dirección con un token firmado.
- **Checklist adaptable:**
  - [ ] Crear `Subscriber` en estado `pending` y enviar email con enlace `?token=<firmado>`.
  - [ ] Endpoint de confirmación que valida el token, marca `confirmed` y solo entonces da la bienvenida.
  - [ ] Caducar tokens; no revelar si el email ya existía (evitar enumeración).

**DEFECTO-007 — Escapar el JSON-LD**

- **Acción:** escapar `<` en el string serializado antes de inyectarlo.
- **Checklist adaptable:**
  - [ ] `JSON.stringify(data).replace(/</g, "\\u003c")` en `JsonLd.tsx`.
  - [ ] Test que serialice un dato con `</script>` y verifique que no rompe la etiqueta.

**DEFECTO-006 — Gate de seguridad en CI**

- **Acción:** subir las deps vulnerables y auditar en cada PR.
- **Checklist adaptable:**
  - [ ] `pnpm up postcss` (y revisar `@prisma/*` cuando publiquen fix de `hono`/`vite` en su tooling).
  - [ ] Añadir step `pnpm audit --prod --audit-level=high` en el job `quality` (o `osv-scanner`).
  - [ ] Añadir `gitleaks`/secret-scan al pipeline.

**DEFECTO-008..011 — Saneamiento de higiene (lote)**

- **Acción:** limpiar muertos, ignorar worktrees, fijar entorno, endurecer tipos.
- **Checklist adaptable:**
  - [ ] Borrar `_shot.mjs` (o moverlo a `scripts/` y referenciarlo) y los types sin uso confirmados por `knip`.
  - [ ] Añadir `.claude/worktrees/` a `.gitignore` y a `knip`/`prettier` ignore.
  - [ ] Añadir `"engines": { "node": ">=22" }` a `package.json`.
  - [ ] Convertir `type` de contacto en `z.enum([...])` con los tipos reales.
  - [ ] Usar id estable como `key` donde el dato lo permita; correr la suite tras cada lote.

**Tabla de priorización**

| Orden | Defecto(s)                | Severidad    | Esfuerzo | Tipo                                 |
| ----- | ------------------------- | ------------ | -------- | ------------------------------------ |
| 1     | DEFECTO-001 + DEFECTO-010 | GRAVE        | Bajo     | 🔥 Apagar incendio (ruta del dinero) |
| 2     | DEFECTO-004               | MODERADO     | Bajo     | Quick win                            |
| 3     | DEFECTO-007               | MODERADO     | Trivial  | Quick win                            |
| 4     | DEFECTO-002 + DEFECTO-003 | MODERADO     | Medio    | Endurecer                            |
| 5     | DEFECTO-005               | MODERADO     | Medio    | Endurecer                            |
| 6     | DEFECTO-006               | MODERADO     | Bajo     | Proceso/CI                           |
| 7     | DEFECTO-008..011          | MICROSCÓPICO | Bajo     | Higiene                              |

---

## 3. PLAN ANEXO DE MAGNIFICACIÓN

### MEJORA-01 — Resiliencia de webhooks de grado producción

- **Objetivo:** que ningún evento de pago se pierda jamás, pase lo que pase con la BD.
- **Justificación:** una vez DEFECTO-001 devuelve 500, el siguiente nivel es persistir el evento crudo antes de procesarlo (inbox pattern) y reconciliar asíncronamente.
- **Beneficios esperados:** cero pérdida de pedidos, auditoría completa de eventos Stripe, reproceso idempotente.
- **Esbozo:** tabla `WebhookEvent(id, type, payload, status, attempts)` → guardar crudo al recibir → procesar en job → DLQ tras N fallos → dashboard de reconciliación.

### MEJORA-02 — Observabilidad de negocio sobre el OTel ya instalado

- **Objetivo:** convertir `@vercel/otel` (ya presente) en alertas sobre SLOs reales.
- **Justificación:** la instrumentación está cableada pero no hay métricas de negocio ni alertas; SigNoz del operador ya ingiere trazas.
- **Beneficios esperados:** detectar DEFECTO-001/004 en producción en segundos en lugar de por reclamación del cliente.
- **Esbozo:** spans con atributos de negocio (`lead.persisted`, `order.persisted`, `email.sent=false`) → alerta SigNoz sobre tasa de fallo de persistencia > 0 → panel de conversión checkout.

### MEJORA-03 — Tests de mutación sobre la lógica crítica

- **Objetivo:** matar mutantes en `validation`, `rate-limit`, `checkout` y el webhook, no solo cubrir líneas.
- **Justificación:** la cobertura ya es alta; el siguiente salto de calidad es probar que los tests _fallan_ cuando el código se rompe (DEFECTO-010 es exactamente un mutante vivo).
- **Beneficios esperados:** confianza real en la suite, no porcentaje cosmético.
- **Esbozo:** Stryker sobre `src/lib` y `src/app/api`; umbral de mutación en CI para la lógica de negocio.

### MEJORA-04 — Capa anti-abuso real

- **Objetivo:** rate-limit distribuido + protección de formularios sin fricción.
- **Justificación:** cierra DEFECTO-002/003/005 de forma definitiva y prepara multi-instancia.
- **Beneficios esperados:** resistencia a spam/DoS, reputación de envío protegida.
- **Esbozo:** Upstash Ratelimit (sliding window) por IP de confianza + Turnstile/altcha en contact/newsletter + double opt-in.

---

## TABLA RESUMEN

| Severidad    | Confirmados | Sospechas | Total  |
| ------------ | ----------- | --------- | ------ |
| CATASTRÓFICO | 0           | 0         | 0      |
| GRAVE        | 1           | 0         | 1      |
| MODERADO     | 6           | 1         | 7      |
| MICROSCÓPICO | 3           | 0         | 3      |
| **TOTAL**    | **10**      | **1**     | **11** |

**Sentencia final.** «Infame» es una calumnia: este repo está en el percentil alto de lo que pasa por aquí — TS estricto sin `any`, suite seria con gate, arquitectura con fronteras de verdad y cero secretos filtrados. El trabajo real cabe en una tarde: apagar DEFECTO-001 (que la ruta del dinero deje de tragar fallos, una línea de criterio + su test) y, de paso, los dos hermanos del mismo pecado en contact/newsletter. Lo demás es endurecimiento (rate-limit, double opt-in, gate de CI) y polvo cosmético que se barre en un commit. Empieza por el orden 1 de la tabla; el resto es lujo sobre una base que ya es sólida.

---

### Reproducir esta auditoría

```bash
cd ~/repositorios/personal/website-alexendrosdev
npx tsc --noEmit --pretty false
npx eslint . --format json
npx prettier --check $(git ls-files '*.ts' '*.tsx' '*.mjs' '*.css' '*.md' '*.mdx')
pnpm audit --json
gitleaks detect --source . --no-banner
npx madge --circular --extensions ts,tsx src
npx knip ; npx jscpd src
pnpm test
```

### Rama de remediación sugerida

`fix/auditoria-01` → atacar en el orden de la tabla de priorización; un commit atómico por defecto, corriendo `pnpm test` (y el caso nuevo de DEFECTO-010) tras cada uno.
