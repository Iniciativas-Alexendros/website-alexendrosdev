import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const exec = promisify(execFile);
const SCRIPT = resolve(__dirname, "../../scripts/validate-tokens.mjs");

describe("WCAG AA contrast — tokens invariants", () => {
  it("todos los pares texto/fondo críticos cumplen ≥ 4.5:1 en light y dark", async () => {
    const { stdout, stderr } = await exec("node", [SCRIPT]);
    const output = stdout + stderr;

    // Extract all contrast results: "✅ label: X.XX:1" or "❌ label: X.XX:1"
    const contrastLines = output
      .split("\n")
      .filter((l) => l.includes(":1"))
      .filter((l) => l.includes("text-") || l.includes("text on"));

    const failing: string[] = [];
    const passing: string[] = [];

    for (const line of contrastLines) {
      if (line.includes("❌")) {
        failing.push(line.trim());
      } else if (line.includes("✅")) {
        passing.push(line.trim());
      }
    }

    // Log passing pairs for visibility in test output
    for (const p of passing) console.log(`  ${p}`);

    // Assert no failing pairs — this is the gate that catches theme regressions
    expect(failing).toEqual([]);
  }, 30_000); // 30s timeout for script execution
});
