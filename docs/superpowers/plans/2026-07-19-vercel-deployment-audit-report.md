# Vercel Deployment Audit — 2026-07-19

## Active Deployments (recent 40)

| Branch                       | State          | Target         | Commit     | Message                                                                              |
| ---------------------------- | -------------- | -------------- | ---------- | ------------------------------------------------------------------------------------ |
| `main`                       | READY          | production     | a7703442d7 | feat: Issue #42 — CTA calendario reservas funcional + BOOKING_URL configurable (#99) |
| `main`                       | READY          | production     | 2a6a0371c1 | fix(deploy): skip auto-deploy on main — solo CI deploy                               |
| `feat/restructure-content`   | **READY**      | **production** | ae65625c66 | **fix: eliminar Blog, Escaparate y "media jornada" del código**                      |
| `fix/vercel-deploy-backstop` | CANCELED       | None           | 2765cf1eee | ci: add deploy backstop job                                                          |
| `feat/monitoring-p1-roadmap` | ERROR          | None           | 464d625889 | feat: monitorización full-stack                                                      |
| `feat/redesign-2026-07-14`   | READY          | None           | d6634be6aa | Merge branch 'main'                                                                  |
| Various others               | CANCELED/ERROR | -              | -          | -                                                                                    |

## Production Deployment (live at alexendros.dev)

- **Deployment URL**: `website-alexendrosdev-hutyywfp1-alexendros-team.vercel.app`
- **Branch**: `main`
- **Commit SHA**: `a7703442d786207ae8e7f9947dd632f9c3cbd91b`
- **Commit Message**: `feat: Issue #42 — CTA calendario reservas funcional + BOOKING_URL configurable (#99)`
- **Aliases**: `alexendros.dev`, `website-alexendrosdev-alexendros-team.vercel.app`, `website-alexendrosdev-git-main-alexendros-team.vercel.app`

## feat/restructure-content Preview

- **Deployment URL**: `website-alexendrosdev-q5ceu6ab1-alexendros-team.vercel.app`
- **Branch**: `feat/restructure-content`
- **Commit SHA**: `ae65625c66cb2d5ce1dfffd47476cb6b0f25be15`
- **Target**: `production` ⚠️ — non-main branch deployed as production target

## ALLOWED_BRANCHES Config

- Only set for **development** target: `main,develop,feat/*,fix/*,chore/*`
- NOT set for production/preview environments (relies on script default)

## Issues Found

### 🔴 Critical

1. **`feat/restructure-content` deployment targeted as production** — non-main branch marked as `target: production` in Vercel, even though it's not aliased to the production domain. This could cause confusion and potentially wrong alias assignments.
2. **`feat/restructure-content` has no `should-build.mjs`** and no `ignoreCommand` in its `vercel.json` — any push to this branch builds unconditionally.

### 🟡 Medium

3. **ALLOWED_BRANCHES only in development env** — production/preview rely on the script's default fallback (`main,develop,feat/*,fix/*,chore/*`). Should be explicit across all environments.
4. **Glob matching bug in `should-build.mjs`** — `feat/*` doesn't match nested paths like `feat/foo/bar`.

### 🟢 Low

5. **Multiple stale branches** still have deployments in Vercel (fix/vercel-deploy-_, chore/_, etc.)
6. **Previous production deployments errored** (3 consecutive ERROR deployments on main before the latest fix)
