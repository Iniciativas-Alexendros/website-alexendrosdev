import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(process.cwd(), "scripts/should-build.mjs");

type Result = { status: number | null; output: string };

function runScript(env: Record<string, string>): Result {
  const result = spawnSync(process.execPath, [script], {
    env: {
      ...process.env,
      ALLOWED_BRANCHES: "main,develop,feat/*,fix/*,chore/*",
      VERCEL_ENV: "",
      VERCEL_GIT_COMMIT_REF: "",
      ...env,
    },
    encoding: "utf8",
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
}

describe("scripts/should-build.mjs", () => {
  it("continúa el build para main con exit 1", () => {
    const result = runScript({ VERCEL_GIT_COMMIT_REF: "refs/heads/main" });

    expect(result.status).toBe(1);
    expect(result.output).toContain("build autorizado");
  });

  it("continúa el build para una rama autorizada con exit 1", () => {
    const result = runScript({ VERCEL_GIT_COMMIT_REF: "refs/heads/fix/ui-a11y" });

    expect(result.status).toBe(1);
    expect(result.output).toContain("matchea ALLOWED_BRANCHES");
  });

  it("omite el build para una rama no autorizada con exit 0", () => {
    const result = runScript({ VERCEL_GIT_COMMIT_REF: "refs/heads/random-experimento" });

    expect(result.status).toBe(0);
    expect(result.output).toContain("build omitido");
  });

  it("continúa el build cuando Vercel ya ha definido el entorno", () => {
    const result = runScript({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "refs/heads/random-experimento",
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain("VERCEL_ENV=production");
  });

  it("omite el build para un entorno Vercel desconocido", () => {
    const result = runScript({
      VERCEL_ENV: "unknown",
      VERCEL_GIT_COMMIT_REF: "refs/heads/random-experimento",
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain("build omitido");
  });
});
