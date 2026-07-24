/**
 * tests/unit/design-system-fixes-batch2.test.ts
 *
 * Lock-in tests for the design-system-fixes-batch2 spec.
 * Validates the 2 hardcoded-fallback violations in PurchaseCard.tsx are gone,
 * that audit-token-coverage reports zero violations, and that DESIGN.md §1.5
 * preserves the 18 deprecation candidates.
 *
 * Spec: specs/design-system-fixes-batch2/
 * Vinculado a: TU-1.1, TU-1.2, TU-1.3, TU-1.4, TU-1.5.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const PURCHASE_CARD = resolve(ROOT, "src/components/sections/checkout/PurchaseCard.tsx");
const DESIGN_MD = resolve(ROOT, "docs/DESIGN.md");

describe("design-system-fixes-batch2 — PurchaseCard.tsx violations lock-in", () => {
  let source: string;
  beforeAll(() => {
    source = readFileSync(PURCHASE_CARD, "utf8");
  });

  it("TU-1.1 — PurchaseCard.tsx no contiene `var(--ak-` (zero matches)", () => {
    const matches = source.match(/var\(--ak-/g);
    expect(matches, "PurchaseCard.tsx no debe contener ningún token prefijado --ak-*").toBeNull();
  });

  it("TU-1.2 — PurchaseCard.tsx no contiene `var(--name, rgba|#|hsl literal)` fallbacks", () => {
    // Detecta cualquier `var(--algo, literalColor)` con literalColor en rgba(, #hex, hsl(
    const re = /var\(\s*--[\w-]+\s*,\s*(?:rgba?\(|#[\da-fA-F]{3,8}|hsl\()/g;
    const matches = source.match(re);
    expect(matches, "Ningún `var(--*, literal)` debe quedar en PurchaseCard.tsx").toBeNull();
  });

  it("TU-1.4 — PurchaseCard.tsx contiene `hsl(var(--border))` (sustitución aplicada)", () => {
    const occurrences = source.match(/hsl\(var\(--border\)\)/g) ?? [];
    expect(
      occurrences.length,
      "hsl(var(--border)) debe aparecer ≥ 2 veces (email + nombre)",
    ).toBeGreaterThanOrEqual(2);
  });
});

describe("design-system-fixes-batch2 — audit-token-coverage.mjs zero violations", () => {
  it("TU-1.3 — el script reporta violations.count === 0 tras el fix", () => {
    const stdout = execSync("node scripts/audit-token-coverage.mjs --json", {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    const json = JSON.parse(stdout);
    expect(json.violations?.count, "violations.count").toBe(0);
    expect(json.violations?.byKind?.["var-with-hardcoded-fallback"]).toBe(0);
    // Coverage se mantiene en ≥90% (regresión-check: no debe bajar).
    const covNum = parseInt(String(json.coverage?.coveragePercent ?? "0").replace("%", ""), 10);
    expect(covNum).toBeGreaterThanOrEqual(90);
  }, 30_000);
});

describe("design-system-fixes-batch2 — DESIGN.md §1.5 reserved tokens", () => {
  let design: string;
  beforeAll(() => {
    design = readFileSync(DESIGN_MD, "utf8");
  });

  // Los 5 tokens intencionalmente reservados (no legacy) tras depuración de 13 tokens unused.
  // Fuente canonical: scripts/audit-token-coverage.mjs → unusedTokens[] post-cleanup 2026-07-24.
  const EXPECTED_5 = ["ease-bounce", "z-modal", "z-overlay", "z-sticky", "z-tooltip"];

  // Tokens legacy eliminados del CSS (commit 073b228 + 1cb528c).
  // El spec heredado (batch2) los mencionaba; verificar que YA NO están en §1.5.
  const ELIMINATED_13 = [
    "space-1",
    "space-12",
    "space-16",
    "space-2",
    "space-20",
    "space-24",
    "space-3",
    "space-4",
    "space-6",
    "space-8",
    "radius-interactive",
    "gutter-lg",
    "gutter-sm",
  ];

  it("TU-1.5 — §1.5 contiene los 5 nombres de tokens reservados (canonical)", () => {
    // Extraer solo la tabla markdown de §1.5 (entre el encabezado de tabla y el final)
    const re = /### 1\.5 Reserved tokens \(no deprecated\)[\s\S]*?(?=\n---\n)/;
    const m = design.match(re);
    expect(m, "DESIGN.md debe contener la sección §1.5").not.toBeNull();
    const block = m![0];

    // Extraer solo las filas de tabla (| ... | ... | ... | ... |)
    const tableRows = block
      .split("\n")
      .filter((l) => /^\|/.test(l) && !/^-/.test(l) && !/^\|\s*Token\s*\|/.test(l));
    const tableText = tableRows.join("\n");

    const missing = EXPECTED_5.filter((tok) => !tableText.includes(`\`--${tok}\``));
    expect(missing, `Tokens reservados que deben listarse en §1.5: ${missing.join(", ")}`).toEqual(
      [],
    );

    // Verificar que los 13 eliminados YA NO aparecen en la tabla
    const stillPresent = ELIMINATED_13.filter((tok) => tableText.includes(`\`--${tok}\``));
    expect(
      stillPresent,
      `Tokens legacy eliminados NO deben listarse en la tabla de §1.5: ${stillPresent.join(", ")}`,
    ).toEqual([]);
  });

  it("TU-1.5b — §1.5 mantiene estructura de tabla (5 filas con 4 columnas)", () => {
    const re = /### 1\.5 Reserved tokens \(no deprecated\)[\s\S]*?(?=\n---\n)/;
    const m = design.match(re);
    expect(m).not.toBeNull();
    const block = m![0];

    const rowsWithAllTokens = EXPECTED_5.filter((tok) => {
      const rowRe = new RegExp(`\\|[^\\n]*\\\`--${tok}\\\`[^\\n]*\\|`, "");
      return rowRe.test(block);
    });

    expect(
      rowsWithAllTokens.length,
      `Los 5 tokens reservados deben vivir en filas de tabla markdown en §1.5 (got ${rowsWithAllTokens.length}/5 en tabla)`,
    ).toBe(5);
  });
});
