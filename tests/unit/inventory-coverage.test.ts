import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const DESIGN_MD = join(ROOT, "docs/DESIGN.md");

/** Extrae la sección §10 (Inventario) y cuenta clases por subcategoría. */
function countClassesInCategory(text: string, category: string): number {
  // Encuentra el bloque que empieza con ### <category> y termina en ### o ## siguiente.
  const re = new RegExp(`###\\s+${category}[^#]*?(?=###|##|$)`, "gs");
  const m = re.exec(text);
  if (!m) return 0;
  const block = m[0];
  // Cuenta ocurrencias únicas de `.ak-*` rules listadas (selector). Ignora modificadores --md.
  const matches = block.match(/\.ak-[a-zA-Z0-9-]+(?!\()/g) ?? [];
  return new Set(matches).size;
}

describe("TU-0.8.a · §10 Layout Patterns ≥ 8 clases únicas", () => {
  it("categoría debe estar presente y poblada", () => {
    const md = readFileSync(DESIGN_MD, "utf-8");
    const n = countClassesInCategory(md, "Layout Patterns");
    expect(n, "Layout Patterns necesita ≥8 clases únicas").toBeGreaterThanOrEqual(8);
  });
});

describe("TU-0.8.b · §10 Graph ≥ 7 clases únicas", () => {
  it("categoría Graph poblada", () => {
    const md = readFileSync(DESIGN_MD, "utf-8");
    const n = countClassesInCategory(md, "Graph");
    expect(n, "Graph necesita ≥7 clases únicas").toBeGreaterThanOrEqual(7);
  });
});

describe("TU-0.8.c · §10 Form System ≥ 15 clases únicas", () => {
  it("categoría Form System poblada", () => {
    const md = readFileSync(DESIGN_MD, "utf-8");
    const n = countClassesInCategory(md, "Form");
    expect(n, "Form System necesita ≥15 clases únicas").toBeGreaterThanOrEqual(15);
  });
});

describe("TU-0.8.d · 6 categorías con ≥5 clases cada una", () => {
  it("§10 cubre las 6 categorías con substancia", () => {
    const md = readFileSync(DESIGN_MD, "utf-8");
    const cats = ["Layout Patterns", "Graph", "Content", "Form", "Skeleton", "States"];
    const failures: string[] = [];
    for (const cat of cats) {
      const n = countClassesInCategory(md, cat);
      if (n < 5) failures.push(`${cat}: ${n} < 5`);
    }
    expect(failures, "categorías con pocas clases: " + failures.join("; ")).toEqual([]);
  });
});
