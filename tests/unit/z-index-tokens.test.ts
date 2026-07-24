import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const TOKENS_CSS = join(ROOT, "src/styles/design-tokens.css");
const SITE_CSS = join(ROOT, "src/styles/site.css");

describe("TU-0.3.a · design-tokens.css define 7 vars --z-* completas", () => {
  const required = [
    { name: "--z-base", value: "1" },
    { name: "--z-content", value: "10" },
    { name: "--z-sticky", value: "40" },
    { name: "--z-header", value: "50" },
    { name: "--z-overlay", value: "60" },
    { name: "--z-modal", value: "70" },
    { name: "--z-tooltip", value: "80" },
  ];

  for (const { name, value } of required) {
    it(`${name}: ${value} declarado`, () => {
      const body = readFileSync(TOKENS_CSS, "utf-8");
      const re = new RegExp(`${name}:\\s*${value}\\s*;`);
      expect(re.test(body), `${name}: ${value} debe estar en design-tokens.css`).toBe(true);
    });
  }
});

describe("TU-0.3.b · site.css no usa z-index literal numérico", () => {
  it("sólo z-index: auto/unset/initial/inherit/revert o var(--z-*) permitidos", () => {
    const body = readFileSync(SITE_CSS, "utf-8");
    // Capturar todas las reglas con z-index
    const issues: string[] = [];
    const lines = body.split("\n");
    let buffer = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      buffer += line + "\n";
      if (line.includes("}")) {
        const m = /z-index:\s*([^;}]+)/g.exec(buffer);
        if (m) {
          for (const v of m[1].split(",")) {
            const trimmed = v.trim();
            const allowed = ["auto", "unset", "initial", "inherit", "revert"];
            const ok = allowed.includes(trimmed) || /var\(--z-/.test(trimmed);
            if (!ok) issues.push(`Línea ~${i + 1}: ${trimmed}`);
          }
        }
        buffer = "";
      }
    }
    expect(issues, `Valores literales no permitidos: ${issues.join(", ")}`).toEqual([]);
  });
});

describe("TU-0.3.c · site.css usa var(--z-*) al menos 5 veces", () => {
  it("uso extendido de tokens z-index en componentes", () => {
    const body = readFileSync(SITE_CSS, "utf-8");
    const matches = body.match(/var\(--z-[a-z]+\)/g) ?? [];
    expect(matches.length, "debería haber ≥5 referencias").toBeGreaterThanOrEqual(5);
  });
});
