import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const STYLES_DIR = join(ROOT, "src/styles");

function readAllCss(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(STYLES_DIR)) return out;
  for (const f of readdirSync(STYLES_DIR)) {
    if (f.endsWith(".css")) out[f] = readFileSync(join(STYLES_DIR, f), "utf-8");
  }
  return out;
}

describe("TU-0.7.a · cero top: (64|88|90)px literales en sticky-affordances fuera de @media", () => {
  it("reglas sticky usan var(--header-height) o calc()", () => {
    const files = readAllCss();
    const bad: string[] = [];
    for (const [name, body] of Object.entries(files)) {
      const lines = body.split("\n");
      let buffer = "";
      let depth = 0;
      let inMedia = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        buffer += line + "\n";
        if (/@media\b/.test(line)) inMedia = true;
        for (const ch of line) {
          if (ch === "{") depth++;
          if (ch === "}") {
            depth--;
            if (depth === 0) {
              if (!inMedia && /\btop:\s*(?:64|88|90)px\b/.test(buffer)) {
                bad.push(`${name}:L${i + 1}`);
              }
              buffer = "";
              inMedia = false;
            }
          }
        }
      }
    }
    expect(bad, `sticky-tops con literal px: ${bad.join("; ")}`).toEqual([]);
  });
});

describe("TU-0.7.b · sticky-affordances usan var(--header-height) en al menos 1 lugar", () => {
  it("establece precedente para futuras sticky positions", () => {
    const files = readAllCss();
    let found = 0;
    for (const body of Object.values(files)) {
      const matches = body.match(
        /top:\s*(?:calc\(var\(--header-height\)\s*\+\s*\d+px\)|var\(--header-height\))/g,
      );
      if (matches) found += matches.length;
    }
    expect(
      found,
      "debe haber ≥1 sticky-affordance migrada a --header-height",
    ).toBeGreaterThanOrEqual(1);
  });
});
