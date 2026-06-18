# Testing — website-alexendrosdev

Guía de la estrategia de tests. Pirámide limpia, determinista y con gate de
cobertura. Las descripciones de los tests están en español, igual que el resto
del repo.

## Pirámide y capas

| Capa            | Carpeta              | Entorno  | Runner           | Qué cubre                                                               |
| --------------- | -------------------- | -------- | ---------------- | ----------------------------------------------------------------------- |
| **Unitarios**   | `tests/unit/`        | node     | Vitest           | Lógica pura/stateful: validación, rate-limit, JSON-LD, blog, contenido. |
| **Integración** | `tests/integration/` | node     | Vitest           | Route Handlers (`contact`, `newsletter`, `checkout`, `stripe/webhook`). |
| **Componentes** | `tests/component/`   | jsdom    | Vitest + RTL     | Islas cliente: formularios, carrusel, filtros, timers, theme.           |
| **E2E**         | `tests/e2e/`         | Chromium | Playwright + axe | Flujos end-to-end y accesibilidad sobre el build de producción.         |

`tests/helpers/` (render RTL, servidor MSW) y `tests/fixtures/` (datos tipados)
dan soporte transversal.

## Comandos

```bash
pnpm test               # Vitest (unit + integración + componentes), una pasada
pnpm test:watch         # Vitest en watch
pnpm test:coverage      # Vitest con cobertura V8 + umbrales (lo que corre CI)
pnpm e2e                # Playwright + axe (levanta el build automáticamente)

# Un solo test
pnpm exec vitest run tests/integration/contact.test.ts
pnpm exec vitest run -t "responde 429"          # filtra por título
pnpm exec vitest run --project unit             # solo node (unit + integración)
pnpm exec vitest run --project component        # solo jsdom (componentes)
pnpm exec playwright test tests/e2e/projects.spec.ts
```

## Configuración (`vitest.config.ts`)

Dos **proyectos** Vitest con entornos aislados y una cobertura unificada:

- `unit` → `environment: node`, globs `tests/unit/**` y `tests/integration/**`.
- `component` → `environment: jsdom` (+ `@vitejs/plugin-react`), glob
  `tests/component/**`, con `setupFiles: tests/setup.component.ts`.

### Alias `server-only` → módulo vacío (imprescindible)

`src/lib/{db,email,stripe,blog,rate-limit}.ts` y los Route Handlers hacen
`import "server-only"`, que **lanza** al cargarse fuera de un entorno RSC. La
config aliasa `server-only` a `tests/helpers/server-only.ts` (vacío) para poder
importar y testear esa lógica en node. No se toca el código de producción.

## Patrones

### Route Handlers (integración) — invocación directa + `vi.mock`

Se importa el `POST` exportado y se le pasa un `Request` estándar. Los clientes
con efectos (`prisma`, `resend`, `stripe`) se mockean con `vi.mock`, usando
**getters sobre estado hoisted** para alternar entre `null` (degradación) y un
objeto espía (persistencia/envío) dentro del mismo fichero:

```ts
const mocks = vi.hoisted(() => ({
  state: { prisma: null as null | { lead: { create: ReturnType<typeof vi.fn> } } },
}));
vi.mock("@/lib/db", () => ({
  get prisma() {
    return mocks.state.prisma;
  },
}));
```

`getPurchasable` (catálogo) **no** se mockea: así se verifica que el precio es
fuente de verdad del servidor. Cada test usa una IP distinta en
`x-forwarded-for` para no colisionar con el rate-limit en memoria.

### Degradación null-safe

Cada rama (`if (prisma)`, `if (resend)`, `if (stripe)`) tiene un test con el
mock en ambos estados. `tests/unit/clients-degradation.test.ts` cubre además la
inicialización real de los clientes (null sin credenciales, instancia con ellas).

### Componentes (jsdom)

`renderWithUser` (de `tests/helpers/render.tsx`) devuelve RTL + `user-event`. La
red se mockea con **MSW** (`tests/helpers/msw/`): handlers por defecto del camino
feliz, y `server.use(...)` por test para 422/503/errores. `@vercel/analytics` y
`matchMedia` se stubean en el setup. Para componentes con timers se usa
`vi.useFakeTimers()` + `act()`.

### Regla RSC (importante)

Vitest **no** puede testear Server Components **asíncronos** (páginas, casos de
estudio): se cubren por **e2e**. Solo se testean con RTL los Client Components y
los Server Components síncronos.

## Cobertura (gate)

`pnpm test:coverage` mide con el provider **v8** sobre `src/lib/**` y
`src/app/api/**` (la superficie con tests deterministas) y **bloquea** si baja de
los umbrales (`vitest.config.ts` → `coverage.thresholds`). Los componentes y
páginas se cubren por comportamiento (proyecto `component` y e2e), no por
porcentaje. El reporte HTML queda en `coverage/`.

Umbrales actuales (lock-in, ver F10.6/F10.8 en `ROADMAP.md`): **statements 93 ·
branches 86 · functions 95 · lines 92**, fijados ~3 pts por debajo de la medición
real ≈ 96/89/98/96 (101 tests verdes).

## Inventario E2E (`tests/e2e/`, Chromium)

| Spec                 | Cubre                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| `smoke.spec.ts`      | Home, toggle de tema, envío de contacto, escaparate.                               |
| `navigation.spec.ts` | El `Header` navega a cada ruta principal y renderiza su `h1`.                      |
| `projects.spec.ts`   | Filtro por categoría, búsqueda, estado vacío, orden y detalle `/proyectos/[slug]`. |
| `blog.spec.ts`       | Listado → post `/blog/[slug]`, filtro y estado vacío.                              |
| `services.spec.ts`   | Toggle de precios (proyecto/retainer), acordeón FAQ, CTA → `/contacto`.            |
| `stack.spec.ts`      | Grafo: detalle inicial, selección por leyenda, zoom.                               |
| `newsletter.spec.ts` | Suscripción del footer (degrada a 200 sin credenciales).                           |
| `checkout.spec.ts`   | «Pagar ahora» sin Stripe → fallback 503 (no redirige).                             |
| `a11y.spec.ts`       | axe sin violaciones `critical` en 8 rutas (incluida `/stack`).                     |

Los specs que navegan a `/proyectos/[slug]` y `/blog/[slug]` son la vía para cubrir
los **Server Components asíncronos** de detalle (regla RSC).
