#!/usr/bin/env node
/**
 * audit-design-tokens.mjs - Audita que font-size y spacing usen tokens, no literales.
 *
 * Escanea archivos CSS/TS/TSX en src/ y falla (exit 1) si detecta:
 *   1. font-size (incl. shorthand font:) con literales px o rem fuera de design-tokens.css
 *   2. margin | padding | gap con valores px que NO sean multiplos de 4
 *      (escala 4/8pt: 0, 4, 8, 12, 16, 20, 24, 28, 32, ... 96)
 *      (whitelist: 0, 1px bordes, 2px focus-ring, 3px radius, 9999px, auto, %, negativos)
 *
 * Uso:  node scripts/audit-design-tokens.mjs
 * Exit: 0 = clean, 1 = violaciones, 2 = error fatal
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const EXCLUDE_PREFIXES = [
  "src/styles/design-tokens.css",
  "src/tokens/tokens.json",
  "src/tokens/tokens.ts",
  "src/emails/",
  "src/app/opengraph-image.tsx",
  "tests/",
  ".next/",
  "node_modules/",
  "scripts/audit-design-tokens.mjs",
];

const EXCLUDE_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", "-snapshots/"];

const WHITELIST_PX = new Set([0, 1, 2, 3, -1, -2, -3, 9999, -9999]);

function isMultipleOf4(n) {
  return n % 4 === 0;
}

function isExcluded(relativePath) {
  for (const prefix of EXCLUDE_PREFIXES) {
    if (relativePath === prefix || relativePath.startsWith(prefix)) return true;
  }
  for (const suffix of EXCLUDE_SUFFIXES) {
    if (relativePath.endsWith(suffix)) return true;
  }
  return false;
}

function isCommentOrString(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("`");
}

function collectFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules" &&
          entry.name !== "__screenshots__"
        ) {
          results.push(...collectFiles(full));
        }
      } else if (entry.isFile()) {
        const ext = entry.name.split(".").pop();
        if (["css", "ts", "tsx", "mjs"].includes(ext)) {
          results.push(full);
        }
      }
    }
  } catch {
    /* skip unreadable */
  }
  return results;
}

function extractPxValues(str) {
  if (/clamp\(/i.test(str) || /calc\(/i.test(str)) return [];
  const re = /(-?\d+(?:\.\d+)?)px/g;
  const values = [];
  let m;
  while ((m = re.exec(str)) !== null) {
    values.push({ value: parseFloat(m[1]), raw: m[0], index: m.index });
  }
  return values;
}

function auditFile(filePath) {
  const relative = filePath.replace(ROOT + "/", "");
  if (isExcluded(relative)) return { fontViolations: [], spacingViolations: [] };

  let lines;
  try {
    lines = readFileSync(filePath, "utf-8").split("\n");
  } catch {
    return { fontViolations: [], spacingViolations: [] };
  }

  const fontViolations = [];
  const spacingViolations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || isCommentOrString(line)) continue;

    const isCSS = relative.endsWith(".css");

    if (isCSS) {
      // Check font-size: property
      const fontSizeMatch = line.match(/\bfont-size\s*:\s*([^;]+?)(?:\s*!)?;/);
      if (fontSizeMatch) {
        const val = fontSizeMatch[1].trim();
        if (/\d(px|rem)$/.test(val) && !val.startsWith("var(")) {
          fontViolations.push({
            file: relative,
            line: i + 1,
            col: fontSizeMatch.index + 1,
            value: val,
            context: line.trim().slice(0, 80),
          });
        }
      }

      // Check font: shorthand (e.g., font: 700 30px var(--font-sans))
      const fontShorthandMatch = line.match(/\bfont\s*:\s*([^;]+?)(?:\s*!)?;/);
      if (fontShorthandMatch) {
        const val = fontShorthandMatch[1].trim();
        const pxMatches = val.match(/(\d+(?:\.\d+)?)px/g);
        if (pxMatches) {
          for (const px of pxMatches) {
            fontViolations.push({
              file: relative,
              line: i + 1,
              col: fontShorthandMatch.index + 1,
              value: px,
              context: line.trim().slice(0, 80),
            });
          }
        }
      }

      // Check spacing properties
      const spacingProps = [
        "margin",
        "margin-top",
        "margin-bottom",
        "margin-left",
        "margin-right",
        "margin-inline",
        "margin-block",
        "padding",
        "padding-top",
        "padding-bottom",
        "padding-left",
        "padding-right",
        "padding-inline",
        "padding-block",
        "gap",
        "column-gap",
        "row-gap",
      ];

      for (const prop of spacingProps) {
        const re = new RegExp(`\\b${prop}\\s*:\\s*([^;]+?)(?:\\s*!)?;`, "i");
        const match = line.match(re);
        if (match) {
          const propName = prop;
          const pxVals = extractPxValues(match[0]);
          for (const pv of pxVals) {
            if (WHITELIST_PX.has(pv.value)) continue;
            if (isMultipleOf4(pv.value) && pv.value >= 4 && pv.value <= 96) continue;
            spacingViolations.push({
              file: relative,
              line: i + 1,
              col: pv.index + 1,
              property: propName,
              value: pv.raw,
              context: line.trim().slice(0, 80),
            });
          }
        }
      }
    }

    if (relative.endsWith(".tsx")) {
      // Check inline font-size in TSX
      const remMatches = line.matchAll(/fontSize:\s*"(\d+(?:\.\d+)?)rem"/g);
      for (const m of remMatches) {
        fontViolations.push({
          file: relative,
          line: i + 1,
          col: m.index + 1,
          value: `${m[1]}rem`,
          context: line.trim().slice(0, 80),
        });
      }

      // Check inline px font-size in TSX
      const fontPxMatches = line.matchAll(/fontSize:\s*"(\d+)px"/g);
      for (const m of fontPxMatches) {
        fontViolations.push({
          file: relative,
          line: i + 1,
          col: m.index + 1,
          value: `${m[1]}px`,
          context: line.trim().slice(0, 80),
        });
      }

      // Check inline spacing in TSX
      const pxStyleMatches = line.matchAll(
        /(margin|padding|gap|marginTop|marginBottom|marginLeft|marginRight|paddingTop|paddingBottom|paddingLeft|paddingRight)(Vertical|Horizontal|Top|Bottom|Left|Right)?:\s*(?:-?(\d+)px|"(\d+)px")/g,
      );
      for (const m of pxStyleMatches) {
        const pxVal = parseInt(m[2] || m[3], 10);
        if (isNaN(pxVal)) continue;
        if (WHITELIST_PX.has(pxVal)) continue;
        if (isMultipleOf4(pxVal) && pxVal >= 4 && pxVal <= 96) continue;
        spacingViolations.push({
          file: relative,
          line: i + 1,
          col: m.index + 1,
          property: m[0].split(/[:"]/)[0].trim(),
          value: `${pxVal}px`,
          context: line.trim().slice(0, 80),
        });
      }
    }
  }

  return { fontViolations, spacingViolations };
}

function main() {
  const srcDir = resolve(ROOT, "src");
  const files = collectFiles(srcDir);

  const allFont = [];
  const allSpacing = [];

  for (const filePath of files) {
    const { fontViolations, spacingViolations } = auditFile(filePath);
    allFont.push(...fontViolations);
    allSpacing.push(...spacingViolations);
  }

  console.log("Auditando tokens de diseno en src/\n");

  let total = 0;

  if (allFont.length === 0) {
    console.log("  font-size: todos usan tokens CSS (var(--fs-*))");
  } else {
    console.log(`  font-size literales (px/rem): ${allFont.length}`);
    for (const v of allFont) {
      console.log(`     ${v.file}:${v.line}:${v.col}  ${v.value}  <- ${v.context}`);
      total++;
    }
  }

  if (allSpacing.length === 0) {
    console.log("  spacing: todos los valores son multiplos de 4 (escala 4/8pt)");
  } else {
    const uniqueVals = new Set();
    for (const v of allSpacing) {
      const key = `${v.file}:${v.line}`;
      if (uniqueVals.has(key)) continue;
      uniqueVals.add(key);
      console.log(`     ${v.file}:${v.line}:${v.col}  ${v.property} = ${v.value}  <- ${v.context}`);
      total++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  if (total === 0) {
    console.log("Todos los tokens de diseño verificados.");
    console.log(`   Escala: multiplos de 4px (0-96)`);
    console.log(
      `   Whitelist px: [${Array.from(WHITELIST_PX)
        .sort((a, b) => a - b)
        .join(", ")}]`,
    );
    process.exit(0);
  } else {
    console.log(`❌ ${total} violación(es) de tokens encontrada(s).`);
    console.log("   Reemplaza literales px/rem por var(--fs-*) / var(--space-*).");
    process.exit(1);
  }
}

main();
