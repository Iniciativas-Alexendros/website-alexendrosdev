# Auditoría visual base

> **Proyecto:** website-alexendrosdev
> **Rama:** `docs/plan-correccion-defectos-visuales`
> **Fecha de auditoría:** 2026-08-08
> **Estado:** auditoría visual base ejecutada localmente; la matriz de capturas se regeneró correctamente. Los resultados de axe/Lighthouse no se declaran como ejecutados en este worktree.

## Objetivo

Establecer una línea base para corregir defectos visuales sin confundir el estado observado con una regresión. La auditoría cubre las rutas públicas definidas en el plan, los temas claro y oscuro y cuatro anchos de viewport. Las rutas dinámicas `/proyectos/[slug]` quedan cubiertas por el snapshot existente de proyectos y se incorporarán a la matriz específica de detalle en la siguiente iteración.

## Cobertura

| Grupo            | Rutas                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| Producto         | `/`, `/servicios`, `/proyectos`, `/stack`, `/sobre-mi`, `/contacto`                    |
| Conversión       | `/checkout/success`, `/newsletter/confirmado`, `/proximamente`                         |
| Legal / fallback | `/legal/privacidad`, `/legal/cookies`, `/legal/condiciones`, `/legal/aviso-legal`, 404 |

| Viewport |    Tema claro     |   Tema oscuro    |
| -------: | :---------------: | :--------------: |
|   360 px | ✅ `light/360-*`  | ✅ `dark/360-*`  |
|   768 px | ✅ `light/768-*`  | ✅ `dark/768-*`  |
|  1280 px | ✅ `light/1280-*` | ✅ `dark/1280-*` |
|  1920 px | ✅ `light/1920-*` | ✅ `dark/1920-*` |

### Generar capturas

El proyecto ya contiene Playwright y Chromium local. La matriz se generó correctamente en este worktree (112 capturas, 14 rutas × 4 viewports × 2 temas). Para regenerarla en un entorno reproducible:

```bash
PLAYWRIGHT_PORT=3100 pnpm exec playwright test tests/e2e/design-audit.spec.ts
```

Las capturas se escriben en `artifacts/design-audit/` (artefactos locales, no se versionan). La prueba fija el tema mediante `localStorage`, espera fuentes e imágenes completas, detiene motion antes de capturar y valida que la respuesta no sea 5xx.

## Estado del tooling existente

| Control       | Estado observado                                                    | Evidencia                                  |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Build         | ✅ pasa                                                             | `pnpm build` genera 39 páginas sin errores |
| TypeScript    | ✅ pasa                                                             | `pnpm typecheck`                           |
| ESLint        | ✅ 0 errores, 11 warnings preexistentes en scripts                  | `pnpm lint`                                |
| Vitest        | ✅ 513 tests                                                        | `pnpm test`                                |
| Axe E2E       | existente, solo light y 7 rutas                                     | `tests/e2e/a11y.spec.ts`                   |
| Screenshots   | ✅ matriz local 14 rutas × 4 viewports × 2 temas (112 capturas)     | `tests/e2e/design-audit.spec.ts`           |
| Lighthouse    | script existente contra producción, no genera esta línea base local | `scripts/audit-lighthouse.mjs`             |
| HTML Validate | script existente contra producción                                  | `scripts/audit-html.mjs`                   |

## Hallazgos verificables antes de corregir

### P0 — estabilidad visual y responsive

1. **Reserva de imagen corregida en esta iteración.** `ProjectImage` usa `next/image` con `fill` y reserva por defecto `aspect-ratio: var(--media-project-ratio)`; los contenedores de héroe y tarjetas pueden sobrescribirla con sus ratios semánticos. El fallback ya no depende de un `minHeight` inline.
2. **Reserva explícita mejorable.** `.ak-terminal-body` ya tiene `min-height: 13rem`; el marquee dependía solo de su padding y ahora declara una altura mínima. La hipótesis de CLS debe confirmarse con una medición de navegador, no asumirse como regresión.
3. **Newsletter estabilizado en esta iteración.** Los inputs tienen `name`, `inputMode`, `autoComplete`, `spellCheck={false}` y placeholder con elipsis; el CTA se deshabilita durante el envío y los estados de placeholder/disabled están tokenizados.
4. **Responsive sin matriz de evidencia.** La mayor parte de las composiciones cambia en `880px`; antes de esta iteración no existía una matriz automatizada para 360/768/1280/1920 ni para ambos temas.

### P1 — sistema de diseño

5. **Valores visuales fuera de tokens.** Se observan estilos inline en páginas y componentes (`height: 36`, `fontSize: 11px`, `marginTop: 8`, `minHeight: 300`, entre otros). El plan pide migrarlos progresivamente, pero no se debe hacer un barrido masivo sin una captura base.
6. **Escala tipográfica declarada, pero no exclusiva.** Los tokens cubren la escala principal, mientras que varios componentes mantienen tamaños literales en CSS/JSX.
7. **Contraste automatizado incompleto.** Hay pruebas de tokens y axe, pero no un gate que recorra los dos temas y todas las rutas del plan.

### P2 — motion y regresión

8. **Reduced motion existe en CSS y componentes clave.** `Marquee`, `Terminal` y `Reveal` ya contemplan variantes reducidas; la matriz se capturó con motion desactivado para hacerla determinista.
9. **Snapshot visual incompleto.** El test existente cubre únicamente el héroe de cinco páginas de proyecto, no todas las rutas, viewports y temas del plan.

## Decisiones para la siguiente iteración

- No inventar screenshots ni scores Lighthouse: esta documentación distingue las capturas locales ejecutadas de los gates de axe/Lighthouse aún pendientes.
- Mantener la matriz de captura local como evidencia reproducible para las siguientes correcciones P0.
- Mantener los artefactos PNG fuera de Git; solo el plan, la prueba y el informe son reproducibles/versionables.
- No ejecutar auditorías de producción desde el worktree sin una petición explícita: pueden ser lentas y dependen de servicios externos.

## Criterio de salida de esta auditoría

La auditoría base queda cerrada: la matriz local contiene 112 capturas bajo `artifacts/design-audit/` y la prueba las regenera de forma determinista. La prueba también comprueba respuesta HTTP, fuentes e imágenes y desactiva motion antes de capturar; no sustituye aún los gates de axe/Lighthouse.
