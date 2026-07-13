#!/usr/bin/env node
/**
 * Script de ignoreBuildStep para Vercel.
 *
 * Vercel ejecuta este script antes de cada build.
 * Exit 0 = build, Exit 1 = skip build.
 *
 * La lógica de decisión está en src/lib/deploy-guide.ts,
 * pero como Vercel ejecuta esto antes del build (sin TS compilado),
 * replicamos la lógica esencial aquí en JS simple.
 */

const ALLOWED_BRANCHES = process.env.ALLOWED_BRANCHES || "main,develop,feat/*,fix/*,chore/*";

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const branch = ref.replace("refs/heads/", "");

// Siempre buildear si VERCEL_ENV ya está decidido por Vercel
if (process.env.VERCEL_ENV) {
  process.exit(0);
}

// Siempre buildear main
if (branch === "main") {
  process.exit(0);
}

// Verificar contra ALLOWED_BRANCHES
function matchesGlob(pattern, candidate) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate);
}

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
