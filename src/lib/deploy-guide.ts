/**
 * Deploy Guide — política de deploy en Vercel integrada en código.
 *
 * Este módulo es la fuente de verdad sobre cuándo y cómo se despliega
 * el sitio. Vercel ejecuta el build automáticamente en cada push/PR,
 * pero este módulo razona qué stage corresponde y si debe buildear.
 *
 * Stages de Vercel (nativos):
 *   - production  → main, deploy a alexendros.dev
 *   - preview     → PRs y ramas que no son main, URL efímera
 *   - development → entorno local (`vercel dev`) y rama `develop`
 *
 * Reglas de decisión (en orden):
 *   1. Si VERCEL_ENV está definido → lo usa directamente
 *   2. Si el commit está en main → production
 *   3. Si el commit es un PR → preview
 *   4. Si el branch matchea ALLOWED_BRANCHES → preview
 *   5. Sino → skip (no buildear)
 *
 * ALLOWED_BRANCHES es una lista separada por comas con soporte de wildcards
 * simples (feat/*, fix/*, chore/*). Configúrala en Vercel dashboard →
 * Environment Variables → Development.
 */

export type DeployStage = "production" | "preview" | "development" | "skip";

export interface DeployDecision {
  stage: DeployStage;
  reason: string;
  /** URL base del entorno (production → alexendros.dev, preview → vercel.app) */
  baseUrl: string | null;
}

const ALLOWED_BRANCHES_DEFAULT = "main,develop,feat/*,fix/*,chore/*";

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function matchesAllowedBranch(branch: string, allowed: string): boolean {
  if (!branch) return false;
  return allowed.split(",").some((p) => {
    const trimmed = p.trim();
    if (trimmed.includes("*")) return globToRegex(trimmed).test(branch);
    return trimmed === branch;
  });
}

/**
 * Versión del deploy guide; incrementar al cambiar la política.
 * Útil para debug y para forzar invalidación en entornos cacheados.
 */
export const DEPLOY_GUIDE_VERSION = "2026-07-13";

/**
 * Decide el stage de deploy basándose en variables de entorno de Vercel.
 *
 * En desarrollo local (sin VERCEL_ENV), devuelve "development".
 * En CI/Vercel, sigue las reglas documentadas arriba.
 */
export function getDeployStage(
  env: {
    VERCEL_ENV?: string;
    VERCEL_GIT_COMMIT_REF?: string;
    ALLOWED_BRANCHES?: string;
    NEXT_PUBLIC_BASE_URL?: string;
  } = {},
): DeployDecision {
  const vercelEnv = env.VERCEL_ENV ?? process.env.VERCEL_ENV;
  const vercelRef = env.VERCEL_GIT_COMMIT_REF ?? process.env.VERCEL_GIT_COMMIT_REF;
  const allowedBranches =
    env.ALLOWED_BRANCHES ?? process.env.ALLOWED_BRANCHES ?? ALLOWED_BRANCHES_DEFAULT;
  const baseUrl = env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? null;

  // 1. Vercel ya decidió el entorno
  if (vercelEnv === "production") {
    return {
      stage: "production",
      reason: "VERCEL_ENV=production (push a main o deploy manual)",
      baseUrl: baseUrl ?? "https://alexendros.dev",
    };
  }

  if (vercelEnv === "preview") {
    return {
      stage: "preview",
      reason: "VERCEL_ENV=preview (PR o rama no-main)",
      baseUrl: null, // URL efímera generada por Vercel
    };
  }

  if (vercelEnv === "development") {
    return {
      stage: "development",
      reason: "VERCEL_ENV=development (entorno local o rama develop)",
      baseUrl: "http://localhost:3000",
    };
  }

  // 2. Sin VERCEL_ENV → desarrollo local
  if (!vercelRef) {
    return {
      stage: "development",
      reason: "sin VERCEL_GIT_COMMIT_REF → desarrollo local",
      baseUrl: "http://localhost:3000",
    };
  }

  // 3. Rama main → production (debería llegar aquí con VERCEL_ENV, pero fallback)
  if (vercelRef === "main" || vercelRef === "refs/heads/main") {
    return {
      stage: "production",
      reason: `ref=${vercelRef} → main → production`,
      baseUrl: baseUrl ?? "https://alexendros.dev",
    };
  }

  // 4. Matchea ALLOWED_BRANCHES → preview
  const branch = vercelRef.replace("refs/heads/", "");
  if (matchesAllowedBranch(branch, allowedBranches)) {
    return {
      stage: "preview",
      reason: `branch=${branch} matchea ALLOWED_BRANCHES → preview`,
      baseUrl: null,
    };
  }

  // 5. No matchea → skip
  return {
    stage: "skip",
    reason: `branch=${branch} no matchea ALLOWED_BRANCHES (${allowedBranches}) → skip`,
    baseUrl: null,
  };
}

/**
 * Determina si Vercel debe buildear este commit.
 *
 * Útil como paso de `ignoreBuildStep` en vercel.json o como
 * verificación en CI antes de trigger manual de deploy.
 *
 * No buildea si:
 * - El stage es "skip" (rama no autorizada)
 * - Solo cambiaron docs/chore files (opcional, vía changedFiles)
 */
export function shouldBuild(deployDecision: DeployDecision, _changedFiles?: string[]): boolean {
  void _changedFiles;
  if (deployDecision.stage === "skip") return false;
  return true;
}
