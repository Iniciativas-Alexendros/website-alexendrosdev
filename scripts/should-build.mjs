#!/usr/bin/env node
/**
 * Script de ignoreBuildStep para Vercel.
 *
 * Vercel ejecuta este script antes de cada build.
 * Exit 0 = build, Exit 1 = skip build.
 *
 * Estrategia:
 * - Auto-deploy (Git integration) en main → SKIP. El CI deploy job se
 *   encarga del despliegue a producción tras quality + e2e. Esto evita
 *   que auto-deploy y CI deploy job compitan por el slot único del plan
 *   Hobby, causando cancelaciones.
 * - Preview deployments (ramas PR) → BUILD. Vercel crea preview URLs.
 * - Local / CI ejecuciones sin VERCEL_ENV → BUILD en ramas permitidas.
 *
 * La lógica de decisión está en src/lib/deploy-guide.ts,
 * pero como Vercel ejecuta esto antes del build (sin TS compilado),
 * replicamos la lógica esencial aquí en JS simple.
 */

const ALLOWED_BRANCHES = process.env.ALLOWED_BRANCHES || "main,develop,feat/*,fix/*,chore/*";

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const branch = ref.replace("refs/heads/", "");

function matchesGlob(pattern, candidate) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate);
}

// ─── Auto-deploy (Vercel Git integration) ────────────────────────
if (process.env.VERCEL_ENV) {
  // main → skip: el CI deploy job despliega tras quality + e2e
  if (branch === "main") {
    console.log(`✗ build saltado en ${process.env.VERCEL_ENV}: CI deploy job gestiona main`);
    process.exit(1);
  }
  // Otras ramas → preview deployment
  console.log(`✓ preview deployment autorizado: branch=${branch}`);
  process.exit(0);
}

// ─── Local / CI (sin VERCEL_ENV) ─────────────────────────────────

// Siempre buildear main
if (branch === "main") {
  process.exit(0);
}

// Verificar contra ALLOWED_BRANCHES
const allowed = ALLOWED_BRANCHES.split(",").some((p) => {
  const trimmed = p.trim();
  if (trimmed.includes("*")) return matchesGlob(trimmed, branch);
  return trimmed === branch;
});

if (allowed) {
  console.log(`✓ build autorizado: branch=${branch} matchea ALLOWED_BRANCHES`);
  process.exit(0);
}

console.log(`✗ build saltado: branch=${branch} no matchea ALLOWED_BRANCHES (${ALLOWED_BRANCHES})`);
process.exit(1);
