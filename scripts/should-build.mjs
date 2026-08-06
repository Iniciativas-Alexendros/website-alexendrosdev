#!/usr/bin/env node
/**
 * Script de ignoreBuildStep para Vercel.
 *
 * Vercel ejecuta este script antes de cada build.
 * Vercel `ignoreCommand` invierte la intuición: Exit 0 = omitir build,
 * Exit 1 = continuar con build. Este script devuelve 1 para ramas autorizadas
 * y 0 para ramas que deben ignorarse.
 *
 * La lógica de decisión está en src/lib/deploy-guide.ts,
 * pero como Vercel ejecuta esto antes del build (sin TS compilado),
 * replicamos la lógica esencial aquí en JS simple.
 */

const ALLOWED_BRANCHES = process.env.ALLOWED_BRANCHES || "main,develop,feat/*,fix/*,chore/*";

const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const branch = ref.replace("refs/heads/", "");

// Si Vercel ya decidió un entorno válido, debe continuar el build.
// `ignoreCommand` considera exit 0 como "sin cambios: omitir".
const knownVercelEnvironments = new Set(["production", "preview", "development"]);
if (knownVercelEnvironments.has(process.env.VERCEL_ENV || "")) {
  console.log(`✓ build autorizado: VERCEL_ENV=${process.env.VERCEL_ENV}`);
  process.exit(1);
}

// Siempre buildear main cuando Vercel no proporciona VERCEL_ENV.
if (branch === "main") {
  console.log("✓ build autorizado: branch=main");
  process.exit(1);
}

// Verificar contra ALLOWED_BRANCHES
function matchesGlob(pattern, candidate) {
  // * solo matchea dentro de un segmento de ruta (no cruza /)
  // ** matchea a través de segmentos (ej: feat/**/fix)
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "___DBL___")
    .replace(/\*/g, "[^/]*")
    .replace(/___DBL___/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate);
}

const allowed = ALLOWED_BRANCHES.split(",").some((p) => {
  const trimmed = p.trim();
  if (trimmed.includes("*")) return matchesGlob(trimmed, branch);
  return trimmed === branch;
});

if (allowed) {
  console.log(`✓ build autorizado: branch=${branch} matchea ALLOWED_BRANCHES`);
  process.exit(1);
}

console.log(`✗ build omitido: branch=${branch} no matchea ALLOWED_BRANCHES (${ALLOWED_BRANCHES})`);
process.exit(0);
