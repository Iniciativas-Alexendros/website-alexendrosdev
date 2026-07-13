# ADR-002: pnpm workspaces como package manager

## Estado
Aceptado

## Contexto
El proyecto puede crecer hacia un monorepo. Se necesita un package manager eficiente en disco, con lockfile determinístico y soporte nativo de workspaces.

## Decisión
Usar **pnpm** con workspaces definidos en `pnpm-workspace.yaml`.

## Alternativas consideradas
- **npm** — más lento, sin hardlinks, workspaces básicos
- **yarn berry (PnP)** — incompatibilidades frecuentes con herramientas nativas de Node
- **bun** — rápido pero ecosistema aún madurando

## Consecuencias
- Instalación más rápida vía hardlinks
- `--frozen-lockfile` en CI garantiza reproducibilidad
- Preparado para monorepo sin migración
- Requiere `pnpm/action-setup` en todos los workflows

## Referencias
- https://pnpm.io/workspaces
