#!/usr/bin/env node
/**
 * audit-hardcoded-colors.mjs — Detecta colores hardcoded (hex, hsl, rgb, oklch)
 * en el código fuente que deberían usar el sistema de tokens OKLCH.
 *
 * Uso:  node scripts/audit-hardcoded-colors.mjs
 * Exit: 0 = clean, 1 = violaciones encontradas, 2 = error fatal
 *
 * Excepciones conocidas (no reportar):
 * - design-tokens.css / tokens.json (definiciones de tokens)
 * - React Email templates (inline styles necesarios para email clients)
 * - opengraph-image.tsx (imagen PNG server-side)
 * - Terminal.tsx (puntos macOS: iconos de ventana)
 * - PurchaseCard.tsx (usa var() con fallback #fff — aceptable)
 * - Archivos de test y snapshots
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Excepciones ────────────────────────────────────────────────────────────

const EXCLUDE_PREFIXES = [
  "src/styles/design-tokens.css",
  "src/tokens/tokens.json",
  "src/tokens/tokens.json.bak",
  "scripts/token-map.mjs",
  "scripts/sync-hex-from-css.mjs",
  "src/emails/",
  "src/app/opengraph-image.tsx",
  "src/components/sections/Terminal.tsx",
  "src/components/sections/checkout/PurchaseCard.tsx",
  "tests/",
  ".next/",
  "node_modules/",
];

const EXCLUDE_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", "-snapshots/"];

// ─── Patrones de color ─────────────────────────────────────────────────────

const HEX_RE = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g;
const HSL_LITERAL_RE = /hsl\(\s*\d+\s+/g;
const OKLCH_LITERAL_RE = /oklch\(\s*\d+\.?\d*%/g;
const RGB_LITERAL_RE = /rgba?\(\s*\d+\s*[,)]/g;

// ─── Helpers ────────────────────────────────────────────────────────────────

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

/** Recoge archivos CSS/TS/TSX recursivamente desde src/. */
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

// ─── Auditoría por archivo ──────────────────────────────────────────────────

function auditFile(filePath) {
  const relative = filePath.replace(ROOT + "/", "");
  if (isExcluded(relative)) return [];

  const violations = [];
  let lines;
  try {
    lines = readFileSync(filePath, "utf-8").split("\n");
  } catch {
    return [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || isCommentOrString(line)) continue;

    const checks = [
      { re: HEX_RE, label: "hex" },
      { re: HSL_LITERAL_RE, label: "hsl() literal" },
      { re: OKLCH_LITERAL_RE, label: "oklch() literal" },
      { re: RGB_LITERAL_RE, label: "rgb() literal" },
    ];

    for (const { re, label } of checks) {
      let match;
      re.lastIndex = 0;
      while ((match = re.exec(line)) !== null) {
        const value = match[0];

        // Saltar oklch(var(...)) y hsl(var(...)) — patrón correcto
        const after = line.slice(match.index);
        if (after.startsWith("oklch(var(") || after.startsWith("hsl(var(")) continue;
        // Saltar oklch() con variable CSS inline
        if (label === "oklch() literal" && after.includes("var(--")) continue;

        violations.push({
          file: relative,
          line: i + 1,
          col: match.index + 1,
          value,
          context: line.trim().slice(0, 70),
        });
      }
    }
  }

  return violations;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const srcDir = resolve(ROOT, "src");
  const files = collectFiles(srcDir);

  const all = { hex: [], hsl: [], oklch: [], rgb: [] };
  const labelMap = {
    hex: { group: "hex", emoji: "🎨", name: "Hex colors hardcoded" },
    "hsl() literal": { group: "hsl", emoji: "🔴", name: "hsl() literales" },
    "oklch() literal": { group: "oklch", emoji: "🟢", name: "oklch() literales (sin var)" },
    "rgb() literal": { group: "rgb", emoji: "🔵", name: "rgb() literales" },
  };

  for (const filePath of files) {
    const violations = auditFile(filePath);
    for (const v of violations) {
      const info = labelMap[v.label];
      if (info) all[info.group].push(v);
    }
  }

  console.log("🔍 Auditando colores hardcoded en src/\n");
  let total = 0;
  let exitCode = 0;

  for (const [group, items] of Object.entries(all)) {
    if (items.length === 0) {
      console.log(`  ${labelMap[group + "() literal"]?.emoji || "✅"} ${group}: 0`);
      continue;
    }
    const emoji = labelMap[`${group}() literal`]?.emoji || "🎨";
    const name =
      group === "hex"
        ? "Hex colors hardcoded"
        : group === "hsl"
          ? "hsl() literales"
          : group === "oklch"
            ? "oklch() literales (sin var)"
            : "rgb() literales";
    console.log(`  ${emoji} ${name}: ${items.length}`);
    for (const v of items) {
      console.log(`     ${v.file}:${v.line}:${v.col}  ${v.value}  ← ${v.context}`);
      total++;
    }
    exitCode = 1;
  }

  console.log(`\n${"=".repeat(50)}`);
  if (total === 0) {
    console.log("✅ Sin colores hardcoded — todos usan tokens OKLCH.");
    process.exit(0);
  } else {
    console.log(`❌ ${total} color(es) hardcoded encontrado(s).`);
    console.log("   Reemplázalos por oklch(var(--<token>)) del sistema de diseño.");
    process.exit(1);
  }
}

main();
