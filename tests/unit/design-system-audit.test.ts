import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const DESIGN_MD = join(ROOT, "docs/DESIGN.md");

/**
 * Spec Truth — TU-0.1
 *
 * Tests que validan que `docs/DESIGN.md` describe la realidad del sistema.
 * Cada uno de estos asserts es un contrato directo entre la documentación y
 * el código real. Si la documentación miente, al menos uno de estos tests
 * falla — lo que rompe el merge en CI y obliga a actualizar el doc.
 *
 * Si el archivo no existe (estado inicial del repo sin `docs/DESIGN.md`),
 * los tests fallan con mensaje claro en lugar de skip silencioso.
 */
function readDesign(): string {
  return readFileSync(DESIGN_MD, "utf-8");
}

describe("TU-0.1.a · §1 z-index scale documentada", () => {
  it("contiene la scale --z-* con sus 7 valores numéricos correctos", () => {
    const md = readDesign();
    // Positivo: cada nombre + su valor numérico aparecen en la misma línea (formato fila tabla).
    const zScale = [
      ["--z-base", "1"],
      ["--z-content", "10"],
      ["--z-sticky", "40"],
      ["--z-header", "50"],
      ["--z-overlay", "60"],
      ["--z-modal", "70"],
      ["--z-tooltip", "80"],
    ];
    for (const [name, value] of zScale) {
      const rowRe = new RegExp(`${name}[^\\n]*\\b${value}\\b`);
      expect(rowRe.test(md), `${name} = ${value} debe aparecer en §1`).toBe(true);
    }
  });

  it("contiene los 7 nombres --z-* (≥7 tokens)", () => {
    const md = readDesign();
    const zVars = [
      "--z-base",
      "--z-content",
      "--z-sticky",
      "--z-header",
      "--z-overlay",
      "--z-modal",
      "--z-tooltip",
    ];
    for (const v of zVars) {
      expect(md, `falta var ${v} en §1`).toContain(v);
    }
  });
});

describe("TU-0.1.b · §2.17 RSC truth (no forwardRef auto-Client)", () => {
  it("explica que forwardRef NO convierte automáticamente a Client Component", () => {
    const md = readDesign();
    // Acepta variantes mayúsculas/minúsculas: el doc debe negar la premisa falsa.
    const re = /forwardRef[^.]*?\b(no|nunca)\b\s+(convierte|transforma|es)/i;
    expect(re.test(md), "§2.17 debe negar que forwardRef convierte automáticamente").toBe(true);
  });
});

describe("TU-0.1.c · resumen ejecutivo score 100% en Token system", () => {
  it("la fila Token system muestra '100%' (no 90%, era mentira)", () => {
    const md = readDesign();
    // Positivo y línea-específico: la línea que contiene 'Token system'
    // debe contener también '100%'. Evita falsos negativos cuando la fila
    // tiene varias celdas (la regex naive se corta en el primer pipe).
    const tokenRowHas100 = md
      .split("\n")
      .some((line) => /Token\s+system/i.test(line) && /\b100\s*%/.test(line));
    expect(tokenRowHas100, "La fila Token system debe puntuar 100% (era mentira 90%)").toBe(true);
  });
});

describe("TU-0.1.d · §6 Mapa de archivos CSS presente", () => {
  it("contiene una sección 'Mapa de Archivos CSS' con ≥6 filas", () => {
    const md = readDesign();
    expect(md, "§6 ausente").toMatch(/##\s+6[^#]*Mapa de Archivos/i);
    // Primer columna: 7 archivos canónicos (incluye _services.css)
    const expected = [
      "globals.css",
      "design-tokens.css",
      "site.css",
      "_contact.css",
      "_navbar.css",
      "_projects.css",
      "_services.css",
    ];
    for (const f of expected) {
      expect(md, `falta ${f} en §6`).toContain(f);
    }
  });
});

describe("TU-0.1.e · §8 ADR del `:where(a):is` con prohibición", () => {
  it("existe sección 'Decisiones de Cascade' que menciona :where(a):is y prohíbe eliminarlo", () => {
    const md = readDesign();
    expect(md, "§8 ausente").toMatch(/##\s+8[^#]*Decisiones de Cascade/i);
    expect(md, "no menciona :where(a):is").toMatch(/:where\(a\):is/);
    // Debe avisar contra eliminar el bloque. Acepta 'prohibici', 'prohibido' o 'no eliminar'.
    const warnRe = /(prohibid|no\s+elimin|cuidado)/i;
    expect(warnRe.test(md), "no hay aviso explícito de prohibición sobre el :where(a):is").toBe(
      true,
    );
  });
});

describe("TU-0.1.f · §9 Animations Canónicas con rise DEPRECATED", () => {
  it("existe tabla de keyframes y marca `@keyframes rise` como DEPRECATED", () => {
    const md = readDesign();
    expect(md, "§9 ausente").toMatch(/##\s+9[^#]*Animations/i);
    expect(md, "menciona rise DEPRECATED").toMatch(/rise[^|\n]*DEPREC/);
    expect(md, "menciona reveal canónica").toMatch(/reveal[^|\n]*canón/i);
  });
});

describe("TU-0.1.g · §10 Inventario de clases con 6 categorías", () => {
  it("§10 incluye las 6 categorías: Layout/Graph/Content/Form/Skeleton/States", () => {
    const md = readDesign();
    expect(md, "§10 ausente").toMatch(/##\s*10[^#]*Inventario/i);
    const cats = ["Layout Patterns", "Graph", "Content", "Form", "Skeleton", "States"];
    for (const cat of cats) {
      expect(md, `falta categoría ${cat}`).toContain(cat);
    }
  });
});
