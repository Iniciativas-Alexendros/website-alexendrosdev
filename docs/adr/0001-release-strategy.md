# ADR-0001 — Estrategia de release

- **Estado:** Aceptado
- **Fecha:** 2026-07-13
- **Decide:** Alejandro Domingo Agustí

## Contexto

El repositorio eliminó `release-please` (commit `d3c306e`) por ruido de
changelog/noise de versionado. Se necesita un flujo automático de versionado
semántico + changelog + tag + GitHub Release que no requiera mantenimiento
manual y sea compatible con Conventional Commits ya impuestos (commitlint).

## Decisión

Adoptar **`semantic-release`** (con `@semantic-release/changelog`,
`@semantic-release/git`, `conventional-changelog`) en vez de re-introducir
`release-please`.

- Versionado y tag automáticos desde los mensajes de commit.
- `CHANGELOG.md` generado por la acción `Release` (no por hook local).
- Commits de release firmados por el bot con `GITHUB_TOKEN`.

## Alternativas consideradas

- **release-please:** descartado — mismo ruido previo que motivó su eliminación.
- **changesets:** viable, pero añade un paso manual de `changeset add` por PR.
- **versionado manual:** rechazado — no escala y rompe trazabilidad.

## Consecuencias

- Positivas: release sin intervención, historial limpio, ADR cumplido.
- Negativas: el tag de versión solo aparece tras merge a `main` (esperado).
- El `package.json` NO lleva `version` fija para publicar a npm (es un sitio, no un paquete).
