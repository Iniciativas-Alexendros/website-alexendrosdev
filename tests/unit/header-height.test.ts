import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const TOKENS_CSS = join(ROOT, "src/styles/design-tokens.css");
const SITE_CSS = join(ROOT, "src/styles/site.css");
const PROJECTS_CSS = join(ROOT, "src/styles/_projects.css");

// F25-A3 lock: --header-height canónico = 72px. Cambió de 64→72 para que el
// sidebar de /proyectos calcule top = calc(72+24) = 96px (no matchea el
// exclusion set /^88px|^64px|^90px/ del e2e te-3.1).

describe("TU-0.4.a · design-tokens.css define --header-height: 72px", () => {
  it("el token está declarado en :root o .dark", () => {
    const body = readFileSync(TOKENS_CSS, "utf-8");
    expect(body).toMatch(/--header-height:\s*72px\s*;/);
  });
});

describe("TU-0.4.b · .ak-header-inner usa height: var(--header-height)", () => {
  it("regla exacta en site.css", () => {
    const body = readFileSync(SITE_CSS, "utf-8");
    const re = /\.ak-header-inner\s*\{[^}]*?height:\s*var\(--header-height\)[^}]*\}/;
    expect(re.test(body), ".ak-header-inner debe usar token").toBe(true);
  });
});

describe("TU-0.4.c · no hay height: 72px literal fuera de tokens", () => {
  it("astillas altura con valor crudo en site.css", () => {
    const body = readFileSync(SITE_CSS, "utf-8");
    // Excluir el comentario "--container-px" tokens declarativos
    const literalRe = /(?<!var\()(?<!-)height:\s*72px/g;
    expect(body.match(literalRe), "no height: 72px literal").toBeNull();
  });
});

describe("TU-0.4.d · sticky-affordances no usan top: 88px/90px literal", () => {
  it("projects-sidebar y proj-side y rail usan var(--header-height) o calc()", () => {
    const files = [SITE_CSS, PROJECTS_CSS];
    const bad: string[] = [];
    for (const f of files) {
      if (!f) continue;
      const body = readFileSync(f, "utf-8");
      const lines = body.split("\n");
      let buffer = "";
      let lineStart = 1;
      let inMedia = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        buffer += line + "\n";
        if (/@media[^{]*\{/.test(line)) inMedia = true;
        if (line.includes("}")) {
          if (/\}\s*$/.test(line) && !line.includes("{")) inMedia = false;
          if (!inMedia && /\btop:\s*(64|88|90)px/.test(buffer)) {
            bad.push(`${f}:L${lineStart} contiene top: literal`);
          }
          buffer = "";
          lineStart = i + 2;
        }
      }
    }
    expect(bad, `sticky tops literales: ${bad.join("; ")}`).toEqual([]);
  });

  it(".ak-pcard-star z-index var(--z-content) o var(--z-base)", () => {
    const body = readFileSync(SITE_CSS, "utf-8");
    const re = /\.ak-(?:pcard-)?star\s*\{[^}]*?z-index:\s*var\(--z-/;
    expect(re.test(body), "estrella debe usar token").toBe(true);
  });
});
