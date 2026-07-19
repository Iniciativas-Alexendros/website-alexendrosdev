import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = resolve(__dirname, "../../scripts/validate-tokens.mjs");

describe("WCAG AA contrast — tokens invariants", () => {
  it("todos los pares texto/fondo críticos cumplen ≥ 4.5:1 en light y dark", () => {
    const result = spawnSync("node", [SCRIPT], {
      encoding: "utf8",
      timeout: 30_000,
    });

    const lines = (result.stdout + result.stderr)
      .split("\n")
      .filter((l) => l.includes(":1"))
      .filter((l) => l.includes("text-") || l.includes("text on"));

    const failing: string[] = [];
    const passing: string[] = [];

    for (const line of lines) {
      if (line.includes("❌")) {
        failing.push(line.trim());
      } else if (line.includes("✅")) {
        passing.push(line.trim());
      }
    }

    for (const p of passing) console.log(`  ${p}`);

    // Guard: ensure at least one pair was evaluated (prevents vacuous pass)
    expect(passing.length + failing.length).toBeGreaterThan(0);

    // Gate: no contrast pair may fall below WCAG AA (4.5:1)
    // This test catches theme regressions that break accessibility contrast
    expect(failing).toEqual([]);
  });

  it("el script validate-tokens.mjs se ejecuta sin errores fatales", () => {
    const result = spawnSync("node", [SCRIPT], {
      encoding: "utf8",
      timeout: 15_000,
    });

    // script errors produce exit code 2, warnings produce exit code 1
    // fatal errors (file not found, syntax error) produce exit code 2
    // we only care about fatal errors here
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(2);
    expect(result.stdout + result.stderr).toContain("tokens");
  });
});
