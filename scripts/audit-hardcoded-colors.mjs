#!/usr/bin/env node
/**
 * audit-hardcoded-colors.mjs — Detecta colores hardcoded en el código fuente
 * que deberían usar el sistema de tokens OKLCH / hsl(var(--…)).
 *
 * Endurecido según spec `design-system-truth` (TS-0.2):
 * - Detecta `#fff` literal específicamente (#fff, #FFF, #ffffff, etc.)
 * - Detecta hex crudo (3, 6, 8 dígitos) con validación de longitud exacta
 * - Detecta `rgb()`/`rgba()` literales fuera de `rgba(0,0,0,0)` y
 *   `rgba(255,255,255,0)` (transparentes)
 * - Excluye SVG data URIs (`data:image/svg+xml,…`)
 * - Excluye comentarios CSS multi-línea (no sólo single-line)
 * - Modo `--json`: emite { file, line, column, value, rule }[]
 * - Modo por defecto: tabla humana como antes (backwards-compatible)
 *
 * Uso:
 *   node scripts/audit-hardcoded-colors.mjs          # exit 0/1 + tabla
 *   node scripts/audit-hardcoded-colors.mjs --json   # exit 0/1 + JSON
 *
 * Exit codes:
 *   0 — 0 hits
 *   1 — ≥1 hit
 *   2 — error fatal
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ARGS = new Set(process.argv.slice(2));
const JSON_MODE = ARGS.has("--json");

// ─── Excepciones (rutas) ───────────────────────────────────────────────────

const EXCLUDE_PREFIXES = [
  "src/styles/design-tokens.css",
  "src/tokens/tokens.json",
  "src/tokens/tokens.json.bak",
  "scripts/token-map.mjs",
  "scripts/sync-hex-from-css.mjs",
  "scripts/audit-hardcoded-colors.mjs", // el script mismo documenta sus propias regex
  "src/emails/",
  "src/app/opengraph-image.tsx",
  "src/components/sections/Terminal.tsx",
  // Nota: site.css._contact.css ya no se excluyen — los tokens OKLCH son obligatorios.
  "tests/",
  ".next/",
  "node_modules/",
];

const EXCLUDE_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", "-snapshots/"];

function isExcluded(relativePath) {
  for (const prefix of EXCLUDE_PREFIXES) {
    if (relativePath === prefix || relativePath.startsWith(prefix)) return true;
  }
  for (const suffix of EXCLUDE_SUFFIXES) {
    if (relativePath.endsWith(suffix)) return true;
  }
  return false;
}

// ─── Tipos de violación ────────────────────────────────────────────────────

const RULES = {
  "color:#fff": {
    re: /(?<![\w-])#fff(?:[^0-9a-fA-F]|$)/gi,
    label: "color:#fff — usar text-on-primary",
  },
  hex: {
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g,
    label: "hex hardcoded — usar var(--token)",
  },
  "hsl-literal": {
    re: /hsl\(\s*\d+\s+/g,
    label: "hsl() con números literales — usar hsl(var(--…))",
  },
  "oklch-literal": {
    re: /oklch\(\s*\d+(?:\.\d+)?%/g,
    label: "oklch() con números literales — usar oklch(var(--…))",
  },
  "rgb-literal": {
    // Captura rgb()/rgba() con nums; se filtra transparencia abajo.
    re: /rgba?\(\s*\d+/g,
    label: "rgb()/rgba() con números literales — usar var(--token)",
    isTransparent,
  },
};

// `rgba(0,0,0,0)` y `rgba(255,255,255,0)` son los únicos transparentes
// generados por el sistema (efectos de overlay). No se reportan.
function isTransparent(argsText) {
  const nums = [...argsText.matchAll(/\d+/g)].map((m) => parseInt(m[0], 10));
  // rgba(?, ?, ?, 0) → último componente (alpha) == 0 ⇒ transparente
  if (nums.length >= 4 && nums[3] === 0) {
    // Y los RGB también deben ser 0 o 255 (no colores válidos)
    const [r, g, b] = nums;
    const isClear = (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
    return isClear;
  }
  return false;
}

// ─── Parser por líneas ─────────────────────────────────────────────────────

/** Comentarios CSS multi-línea: /* … *\/  / comentarios shell #, JS //, /* … *\/ */
function isCommentLine(line, inBlockComment) {
  const trimmed = line.trim();
  if (inBlockComment) {
    // Sigue dentro de un bloque CSS /* … */ hasta encontrar "*/"
    return { isComment: true, inBlock: !line.includes("*/") };
  }
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return { isComment: true, inBlock: line.includes("/*") && !line.includes("*/") };
  }
  return { isComment: false, inBlock: false };
}

/** Detecta data URIs SVG (excluidos). */
function isSvgDataUri(line) {
  return /data:image\/svg\+xml/i.test(line);
}

/** Detecta `var(...)` o `var(--…)` legitimate uses (excluidos). */
function isVarPattern(line, matchIndex) {
  const after = line.slice(matchIndex);
  return (
    /^(?:\s*var\(|var\()/i.test(after) ||
    /hsl\(\s*var\(/i.test(after) ||
    /oklch\(\s*var\(/i.test(after)
  );
}

// ─── Auditoría por archivo ────────────────────────────────────────────────

function auditFile(filePath) {
  const relative = filePath.replace(ROOT + "/", "");
  if (isExcluded(relative)) return [];

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  // Eliminar comentarios CSS multi-línea /* … */
  content = content.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));

  const violations = [];
  const lines = content.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isSvgDataUri(line)) continue;

    const commentState = isCommentLine(line, inBlockComment);
    inBlockComment = commentState.inBlock;
    if (commentState.isComment) continue;

    for (const [ruleName, ruleSpec] of Object.entries(RULES)) {
      ruleSpec.re.lastIndex = 0;
      let match;
      while ((match = ruleSpec.re.exec(line)) !== null) {
        if (isVarPattern(line, match.index)) continue;
        if (ruleName === "rgb-literal" && ruleSpec.isTransparent?.(line)) continue;
        violations.push({
          file: relative,
          line: i + 1,
          column: match.index + 1,
          rule: ruleName,
          value: match[0],
          context: line.trim().slice(0, 70),
        });
      }
    }
  }

  return violations;
}

// ─── Recolección de archivos ──────────────────────────────────────────────

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

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const srcDir = resolve(ROOT, "src");
  const files = collectFiles(srcDir);
  const all = [];
  for (const f of files) {
    const violations = auditFile(f);
    if (violations.length) all.push(...violations);
  }

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({ count: all.length, violations: all }, null, 2) + "\n");
    process.exit(all.length ? 1 : 0);
  }

  // Output humano (backwards-compatible)
  console.log("🔍 Auditando colores hardcoded en src/\n");
  console.log(`  ${all.length === 0 ? "✅" : "❌"} Hits totales: ${all.length}\n`);
  if (all.length > 0) {
    const byFile = new Map();
    for (const v of all) {
      if (!byFile.has(v.file)) byFile.set(v.file, []);
      byFile.get(v.file).push(v);
    }
    for (const [file, vs] of byFile) {
      console.log(`  ${file}`);
      for (const v of vs) {
        console.log(`    L${v.line}:${v.column}  [${v.rule}]  ${v.value}  ← ${v.context}`);
      }
    }
  }
  console.log(`\n${"=".repeat(50)}`);
  if (all.length === 0) {
    console.log("✅ Sin colores hardcoded — todos usan tokens.");
  } else {
    console.log(`❌ ${all.length} violación(es). Reemplazar por var(--token).`);
    process.exit(1);
  }
}

main();
