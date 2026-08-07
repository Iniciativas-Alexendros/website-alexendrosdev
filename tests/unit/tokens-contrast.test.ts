import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT = resolve(__dirname, "../../scripts/validate-tokens.mjs");

describe("WCAG AA contrast — tokens invariants", () => {
  it("el script validate-tokens.mjs completa sin errores fatales", () => {
    const result = spawnSync("node", [SCRIPT], {
      encoding: "utf8",
      timeout: 30_000,
    });

    // script errors produce exit code 2, warnings produce exit code 1
    // fatal errors (file not found, syntax error) produce exit code 2
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(2);

    // Verify the script ran all checks
    const output = result.stdout + result.stderr;
    expect(output).toContain("Check 1");
    expect(output).toContain("Check 2");
    expect(output).toContain("Check 3");
    expect(output).toContain("Check 4");
    expect(output).toContain("Check 5");
    expect(output).toContain("Check 6");

    // Verify the script completed with sync message
    expect(output).toContain("tokens are in sync");
  });

  it("los tokens CSS y DTCG están sincronizados (no orphans)", () => {
    const result = spawnSync("node", [SCRIPT], {
      encoding: "utf8",
      timeout: 15_000,
    });

    const output = result.stdout + result.stderr;

    // Should not have any orphaned tokens (warnings about missing mappings)
    expect(output).not.toContain("not found in tokens.json");
    // "No stale DTCG tokens" is a success message, not an error
    expect(output).not.toContain("⚠️  DTCG token");
  });
});
