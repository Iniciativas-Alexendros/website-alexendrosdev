<!-- Título: tipo(scope): resumen conciso (imperativo, max 72 chars) -->

## Qué cambia

<!-- Describe el cambio y el motivo. Enlaza issues/ADRs si aplica. -->

## Tipo de cambio

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] CI / tooling
- [ ] Infra / deploy

## Checklist

- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` limpio
- [ ] `pnpm test:coverage` verde (gates 85/80/85/85)
- [ ] `pnpm knip` sin exportaciones muertas
- [ ] `pnpm gitleaks` sin secretos
- [ ] Cambios de arquitectura tienen ADR en `docs/adr/`

## Notas para revisión

<!-- Riesgos, decisiones, qué no cubre este PR. -->
