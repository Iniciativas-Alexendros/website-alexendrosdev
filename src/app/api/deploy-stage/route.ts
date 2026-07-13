import { NextResponse } from "next/server";
import { getDeployStage, DEPLOY_GUIDE_VERSION } from "@/lib/deploy-guide";

export const dynamic = "force-dynamic";

/**
 * GET /api/deploy-stage
 *
 * Endpoint público que reporta el stage de deploy actual y la versión
 * de la política. Útil para:
 * - Health checks que quieren saber en qué entorno están
 * - Debug post-deploy
 * - Monitores externos que adaptan comportamiento según stage
 */
export function GET() {
  const decision = getDeployStage();
  return NextResponse.json({
    stage: decision.stage,
    reason: decision.reason,
    baseUrl: decision.baseUrl,
    guideVersion: DEPLOY_GUIDE_VERSION,
    timestamp: new Date().toISOString(),
  });
}
