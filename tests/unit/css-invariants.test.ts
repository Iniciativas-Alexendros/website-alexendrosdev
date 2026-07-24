import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const STYLES_DIR = join(ROOT, "src/styles");
const TOKENS_CSS = join(STYLES_DIR, "design-tokens.css");
const GLOBALS_CSS = join(ROOT, "src/app/globals.css");

/** Lee todos los .css dentro de src/styles, excluyendo snapshots. */
function readAllCss(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(STYLES_DIR)) return out;
  for (const f of readdirSync(STYLES_DIR)) {
    if (f.endsWith(".css")) out[f] = readFileSync(join(STYLES_DIR, f), "utf-8");
  }
  return out;
}

/** Cuenta cuántas veces aparece `pattern` (new RegExp, fuente) en un texto. */
function countMatches(text: string, pattern: RegExp): number {
  const re = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
  );
  return text.match(re)?.length ?? 0;
}

describe("TU-0.2.a · rise NO keyframe canónico", () => {
  it("@keyframes rise aparece 0 veces en src/styles/**/*.css", () => {
    const files = readAllCss();
    let total = 0;
    for (const [name, body] of Object.entries(files)) {
      const n = countMatches(body, /@keyframes\s+rise\s*\{/g);
      if (n > 0) {
        // Información útil si falla
        console.warn(`raise keyframe aún presente en ${name}: ${n}`);
      }
      total += n;
    }
    expect(total, "rise debe eliminarse tras RF6.5").toBe(0);
  });
});

describe("TU-0.2.b · reveal keyframe canónica", () => {
  it("@keyframes reveal aparece al menos 1 vez", () => {
    const files = readAllCss();
    let total = 0;
    for (const body of Object.values(files)) {
      total += countMatches(body, /@keyframes\s+reveal\s*\{/g);
    }
    expect(total, "reveal debe existir en algún .css").toBeGreaterThanOrEqual(1);
  });
});

describe("TU-0.2.c · color: #fff prohibido en site.css", () => {
  it("cero ocurrencias de 'color: #fff' en site.css", () => {
    const body = readFileSync(join(STYLES_DIR, "site.css"), "utf-8");
    const n = countMatches(body, /color:\s*#fff/gi);
    expect(n, "debe ser 0 (HC-1 cerrado)").toBe(0);
  });
});

describe("TU-0.2.d · padding: 0 32px ≤ 0 (HC-2 cerrado)", () => {
  it("cero ocurrencias de padding: 0 32px en site.css (migrado a var(--container-px))", () => {
    const body = readFileSync(join(STYLES_DIR, "site.css"), "utf-8");
    const n = countMatches(body, /padding:\s*0\s+32px/gi);
    expect(n, "HC-2 debe migrarse a padding-inline: var(--container-px)").toBe(0);
  });
});

describe("TU-0.2.e · --header-height usado en .ak-header-inner", () => {
  it("design-tokens.css define --header-height: 72px (F25-A3 lock)", () => {
    const body = readFileSync(TOKENS_CSS, "utf-8");
    expect(
      /--header-height:\s*72px/.test(body),
      "F25-A3: header-height canónico en 72px (sidebar top = calc(72+24) = 96px, evita exclusion set /^88px|^64px|^90px/)",
    ).toBe(true);
  });

  it(".ak-header-inner usa height: var(--header-height)", () => {
    const body = readFileSync(join(STYLES_DIR, "site.css"), "utf-8");
    const ruleRe = /\.ak-header-inner\s*\{[^}]*height:\s*var\(--header-height\)[^}]*\}/;
    expect(ruleRe.test(body), ".ak-header-inner debe usar token").toBe(true);
  });
});

describe("TU-0.2.f · cada clase ak-* vive en exactamente 1 archivo", () => {
  const groups: Array<{ className: string; allowModifier?: string }> = [
    { className: "ak-eyebrow" },
    { className: "ak-form-card" },
    { className: "ak-field" },
    { className: "ak-label" },
    // .ak-cal-head .ak-label es subselector; comprobamos sólo la regla base.
    { className: "ak-input" },
    { className: "ak-textarea" },
    { className: "ak-side-group-t" },
    { className: "ak-skeleton" },
    { className: "ak-progress" },
    { className: "ak-progress-bar" },
    { className: "ak-panel" }, // DUP-8 closure — vive exclusivamente en _contact.css.
  ];

  for (const { className } of groups) {
    it(`${className} vive exactamente en 1 archivo .css dentro de src/styles/`, () => {
      const files = readAllCss();
      let count = 0;
      for (const body of Object.values(files)) {
        // regex: `^\s*\.${className}\s*(?:\{|,)` con flag `m`:
        //   1. `^\s*\.` tolera indentación pero fuerza inicio de línea (con multilinea `m`),
        //   2. `\s*(?:\{|,)` acepta `\{` o `,` post-className, así que cubre
        //      tanto la línea base `.ak-X {` como selectores agrupados
        //      `.ak-X,\n.ak-Y {`. Sin lookahead porque el sufijo estricto basta:
        //      `--` no satisface `\s*\{|,`, así que variantes con modificador
        //      como `.ak-X--md` quedan excluidas automáticamente.
        // Además strippeamos block comments para evitar falsos positivos
        // por menciones literales tipo `/* .ak-field { removed */` en prosa.
        const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");
        const re = new RegExp(`^\\s*\\.${className}\\s*(?:\\{|,)`, "gm");
        const n = stripped.match(re)?.length ?? 0;
        count += n;
      }
      expect(count, `${className} debería estar en exactamente 1 lugar`).toBe(1);
    });
  }
});

describe("TU-0.2.f.2 · .ak-panel fija padding: 22px (lock visual DUP-8)", () => {
  // Cierra el gap que TU-0.2.f deja abierto: podría alguien mantener count===1
  // pero cambiar el padding a 18px, revirtiendo silenciosamente el F2 downgrade.
  // Restricción arquitectónica: el valor debe ser LITERAL `22px`, no `var(--*)`.
  // Migración futura a token requeriría actualizar ambos tests simultáneamente
  // (ver DESIGN.md §11 nota sobre la irreversibilidad del cierre).
  it(".ak-panel define padding: 22px en _contact.css (no 18px)", () => {
    const body = readFileSync(join(STYLES_DIR, "_contact.css"), "utf-8");
    const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped, "DUP-8 visual lock: padding debe ser 22px literal").toMatch(
      /\.ak-panel\s*\{[^}]*padding:\s*22px[^}]*\}/,
    );
  });

  it(".ak-panel NO contiene padding: 18px en ningún archivo de src/styles/", () => {
    const files = readAllCss();
    for (const [name, body] of Object.entries(files)) {
      const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(
        stripped,
        `${name}: .ak-panel no debe nunca llevar padding: 18px (cierre DUP-8)`,
      ).not.toMatch(/\.ak-panel\s*\{[^}]*padding:\s*18px[^}]*\}/);
    }
  });
});

describe("TU-0.2.g · globals.css importa _services.css (no components/ServicesView.css)", () => {
  it("globals.css tiene @import con _services.css", () => {
    expect(existsSync(GLOBALS_CSS)).toBe(true);
    const body = readFileSync(GLOBALS_CSS, "utf-8");
    expect(body, "globals.css debe importar _services.css (RF10.2)").toMatch(
      /@import\s+["'][^"']*_services\.css["']/,
    );
  });

  it("globals.css NO importa ../components/sections/services/ServicesView.css", () => {
    const body = readFileSync(GLOBALS_CSS, "utf-8");
    expect(body, "ARCH-5: mover a src/styles/_services.css").not.toMatch(
      /services\/ServicesView\.css/,
    );
  });
});

describe("TU-0.2.h · ak-tl-dot.active alineado con base (VISUAL-6)", () => {
  it(".ak-tl-dot { left: -29px } y .ak-tl-dot.active { left: -29px } mismo offset", () => {
    const body = readFileSync(join(STYLES_DIR, "site.css"), "utf-8");
    const base = /\.ak-tl-dot\s*\{[^}]*?left:\s*(-?\d+)px[^}]*\}/.exec(body)?.[0];
    const active = /\.ak-tl-dot\.active\s*\{[^}]*?left:\s*(-?\d+)px[^}]*\}/.exec(body)?.[0];
    expect(base, "regla base debe existir").toBeTruthy();
    expect(active, "regla active debe existir").toBeTruthy();
    const m1 = /left:\s*(-?\d+)px/.exec(base!);
    const m2 = /left:\s*(-?\d+)px/.exec(active!);
    expect(m1?.[1], "offset base").toBe(m2?.[1]);
  });
});
