import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const TOKENS_CSS = join(ROOT, "src/styles/design-tokens.css");
const GLOBALS_CSS = join(ROOT, "src/app/globals.css");

/**
 * TU-0.5 — ARCH-1 (mezcla de responsabilidades en design-tokens.css)
 * Tras F2.4, design-tokens.css queda con 4 secciones top-level:
 *   1. rule `:root` con tokens
 *   2. rule `.dark` con overrides
 *   3. bloque semantic defaults (body, h1..h4, a, .display, .body-lg, etc.)
 *   4. regla `@theme inline` exponiendo tokens a Tailwind v4
 * Sin @keyframes (estos migran a site.css en F2.4).
 */
describe("TU-0.5.a · design-tokens.css sin @keyframes (migrados a site.css)", () => {
  it("cero @keyframes en design-tokens.css fuera de comentarios", () => {
    const body = readFileSync(TOKENS_CSS, "utf-8");
    // Strip block comments (`/* ... */`) para no matchear menciones literales como
    // "@keyframes sitio" en comentarios narrativos. Sólo cuentan declaraciones reales.
    const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");
    const matches = stripped.match(/@keyframes\s+\w+/g);
    expect(matches, "todos los keyframes deben estar en site.css ahora").toBeNull();
  });
});

describe("TU-0.5.b · design-tokens.css tiene 4 secciones top-level", () => {
  it("estructura esperada: :root + .dark + semantic-defaults + @theme inline", () => {
    const body = readFileSync(TOKENS_CSS, "utf-8");
    expect(body).toMatch(/^:root\s*\{/m);
    expect(body).toMatch(/^\.dark\s*\{/m);
    expect(body).toMatch(/^@theme\s+inline\s*\{/m);
    // semantic defaults: body, h1, h2, h3, h4, .display, etc. están fuera de @layer.
    expect(body, "debe contener body{} de semantic defaults").toMatch(/^body\s*\{/m);
    expect(body, "debe contener h1,/h2 selectors").toMatch(/^h1,\s*\.h1/m);

    // Excluye otras secciones top-level no permitidas
    const topSections = body.match(/^(?::root|\.dark|@theme\s+inline|@keyframes|@media)\s*\{/gm);
    expect(
      topSections,
      "sólo :root, .dark y @theme inline permitidos como secciones top-level",
    ).toBeTruthy();
  });
});

/**
 * TU-0.6 — ARCH-2 (orden de @import en globals.css)
 * Verifica el orden exacto declarado en contract.md §2.1.
 */
describe("TU-0.6 · globals.css imports en orden canónico", () => {
  const expectedOrder = [
    /@import\s+["']tailwindcss["']\s+source\(none\)/,
    /@source\s+["'][^"']*src\/.*\.{ts,tsx,js,jsx,css}["']/,
    /@import\s+["'][^"']*design-tokens\.css["']/,
    /@import\s+["'][^"']*site\.css["']/,
    /@import\s+["'][^"']*_projects\.css["']/,
    /@import\s+["'][^"']*_contact\.css["']/,
    /@import\s+["'][^"']*_navbar\.css["']/,
    /@import\s+["'][^"']*_services\.css["']/,
  ];

  it("el orden y número de @imports es el documentado", () => {
    const body = readFileSync(GLOBALS_CSS, "utf-8");
    const lines = body.split("\n");
    const importLines: string[] = [];
    for (const l of lines) {
      if (/^\s*@import\b/.test(l) || /^\s*@source\b/.test(l)) {
        importLines.push(l);
      }
    }
    expect(importLines.length, "@import + @source total").toBe(expectedOrder.length);
    for (let i = 0; i < expectedOrder.length; i++) {
      expect(
        expectedOrder[i].test(importLines[i]),
        `orden o contenido en línea ${i + 1}: ${importLines[i]}`,
      ).toBe(true);
    }
  });
});
