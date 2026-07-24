#!/usr/bin/env node
/**
 * fix-token-coverage.mjs — Auto-fix del design token system basado en el output
 * de `scripts/audit-token-coverage.mjs --json`.
 *
 * Lee el JSON (path como argumento o stdin) y propone DOS tipos de patches:
 *
 *   1. SOURCE PATCHES — corrige las violaciones `var-with-hardcoded-fallback`
 *      en código cliente (PurchaseCard.tsx y similares). Estrategia: el JSON
 *      puede contener fallbacks malformados (por el non-greedy VAR_RE del
 *      audit), por lo que el fix script re-parsea el archivo local con el
 *      parser de `scripts/utils/css-var-parser.mjs` y reescribe el bloque
 *      `var(--*-fallback)` a su token canónico con `hsl(...)` envolvente.
 *
 *   2. DOC PATCHES — añade los tokens UNUSED como `### 1.5 Deprecated tokens
 *      (considerar)` en `docs/DESIGN.md`, dentro de §1 Token System.
 *
 * Uso:
 *   node scripts/fix-token-coverage.mjs                              # dry-run default
 *   node scripts/fix-token-coverage.mjs /tmp/audit.json               # dry-run con path
 *   node scripts/fix-token-coverage.mjs --apply                      # write atómico
 *   node scripts/fix-token-coverage.mjs /tmp/audit.json --apply      # con path
 *   cat audit.json | node scripts/fix-token-coverage.mjs --json      # JSON output
 *
 * Modos:
 *
 *   DRY-RUN (default): imprime diffs propuestos unified-style + summary.
 *     Exit 0: nada que parchar o solo skips idempotentes.
 *     Exit 1: ≥1 patch propuesto (revisar manualmente antes de --apply).
 *
 *   APPLY (--apply): escribe los patches con swap atómico `file.new` → `file`.
 *     Antes del write: verifica que la firma de violación aún existe (idempotencia).
 *     Después del write: verifica que el archivo está bien formado.
 *
 *   JSON (--json): output machine-readable { proposed, applied, skipped, errors }.
 *
 *   STRICT (--strict): falla el dry-run si hay unmapped violations.
 *
 * Exit codes:
 *   0 — dry-run limpio (no patches OR solo skips idempotentes)
 *   1 — dry-run con ≥1 patch propuesto (revisar antes de --apply)
 *   2 — error fatal (audit JSON inválido, design-tokens.css no existe, etc.)
 */

import { readFileSync, existsSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyVarReplacements } from "./utils/css-var-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DESIGN_MD = resolve(ROOT, "docs/DESIGN.md");

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes("--apply");
const JSON_MODE = ARGS.includes("--json");
const STRICT = ARGS.includes("--strict");
const AUDIT_PATH = ARGS.find((a) => !a.startsWith("--")) || "/tmp/audit-coverage.json";

// ───────────────────────────────────────────────────────────────────────
// TOKEN MAPPING TABLE
// ───────────────────────────────────────────────────────────────────────
// Cada entry mapea un token "huérfano/violador" a su canonical replacement
// en design-tokens.css. La estrategia es REEMPLAZAR el uso completo del `var()`
// por `hsl(var(--canonical))` para preservar el formato del design system.
//
// Si una violation está en JSON.doubleViolations pero el token NO aparece en
// esta tabla, será marcado como UNMAPPED y el script:
//   - Sin --strict: emite warning y propone `var(--token)` sin fallback
//     (más conservador — preserva el behavior actual si el token se define luego).
//   - Con --strict: emite error fatal y el script termina.
//
const MAPPING_TABLE = {
  "ak-bg": {
    canonical: "bg-base",
    rational:
      "Background base surface; hsl() wrapper necesario porque --bg-base es chroma+lightness.",
    replacement: "hsl(var(--bg-base))",
  },
  "ak-border": {
    canonical: "border",
    rational: "Border neutral principal; semantic equivalente a 1px solid rgba(0,0,0,0.15).",
    replacement: "hsl(var(--border))",
  },
  "ak-surface-2": {
    canonical: "bg-inset",
    rational: "Surface tono 2 = paleta inset del design system; rgba(0,0,0,0.04) ≈ bg-inset Light.",
    replacement: "hsl(var(--bg-inset))",
  },
};

// ───────────────────────────────────────────────────────────────────────
// Read audit JSON (path or stdin)
// ───────────────────────────────────────────────────────────────────────

function loadAudit() {
  if (AUDIT_PATH !== "/tmp/audit-coverage.json" && !existsSync(AUDIT_PATH)) {
    console.error(`❌ audit JSON no encontrado en ${AUDIT_PATH}`);
    process.exit(2);
  }
  if (existsSync(AUDIT_PATH)) {
    return JSON.parse(readFileSync(AUDIT_PATH, "utf-8"));
  }
  // stdin fallback
  try {
    const stdin = readFileSync(0, "utf-8");
    return JSON.parse(stdin);
  } catch (e) {
    console.error(`❌ no se pudo leer audit JSON desde path o stdin: ${e.message}`);
    process.exit(2);
  }
}

// ───────────────────────────────────────────────────────────────────────
// Build SOURCE PATCHES from violations
// ───────────────────────────────────────────────────────────────────────
// For each violation, derive a Patch entry keyed by source file. Token name
// comes from JSON.v.token (without `--` prefix). Replacement comes from
// MAPPING_TABLE[token].replacement or is conservative-empty if unmapped.

function buildSourcePatches(doubleViolations) {
  const patchesByFile = new Map(); // file → [{ token, line, replacement, original }]

  for (const v of doubleViolations) {
    const file = resolve(ROOT, v.file);
    if (!existsSync(file)) {
      patchesByFile.set(file, [
        ...(patchesByFile.get(file) || []),
        { ...v, error: "file-missing" },
      ]);
      continue;
    }

    const mapping = MAPPING_TABLE[v.token];
    if (!mapping) {
      // UNMAPPED: conservative — strip fallback only, keep token name.
      patchesByFile.set(file, [
        ...(patchesByFile.get(file) || []),
        {
          ...v,
          mapping: null,
          replacement: `var(--${v.token})`,
          rational:
            "Token no está en MAPPING_TABLE; conservador: elimina fallback sin cambiar nombre.",
        },
      ]);
      continue;
    }

    patchesByFile.set(file, [
      ...(patchesByFile.get(file) || []),
      {
        ...v,
        mapping,
        replacement: mapping.replacement,
        rational: mapping.rational,
      },
    ]);
  }

  return patchesByFile;
}

// Local re-parse: replace the full `"var(--token, fallback)"` literal in source
// with the canonical replacement. Delegates to `scripts/utils/css-var-parser.mjs`
// — a single-pass linear scanner with paren-depth tracking that correctly
// handles arbitrarily-nested fallbacks (rgba(), hsl(), calc(), clamp(),
// linear-gradient(), color-mix(), chained var(), etc.).
//
// PRE-BATCH3 history: the regex `[^()]*` (and its 1-level variants) silently
// missed any `var(--x, nested-fallback)` whose fallback itself contained
// parens. Fixed 2026-07-24 by replacing the regex with a proper AST walk.
// Regression test: tests/unit/css-var-parser.test.ts — 50 stress-test strings.
function applyLocalPatches(src, patches) {
  // Build parser mapping keyed by token name (without `--`). We pass no
  // wrapInQuotes flag — defaults to AUTO-DETECT: if the var() was originally
  // wrapped in `"..."` (inline JSX style attribute), the wrapping is preserved
  // via slice-based replacement; if it was unwrapped (raw CSS context), the
  // replacement stays unwrapped. This handles both real-world contexts.
  const mapping = {};
  for (const p of patches) {
    if (p.error) continue;
    if (!mapping[p.token]) {
      mapping[p.token] = {
        replacement: p.replacement,
        // wrapInQuotes omitted deliberately → auto-detect mode.
      };
    }
  }

  const { result, applied, occurrences } = applyVarReplacements(src, mapping);
  return { result, applied, occurrences };
}

// ───────────────────────────────────────────────────────────────────────
// Build DOC PATCHES (unusedTokens → DESIGN.md §1.5)
// ───────────────────────────────────────────────────────────────────────

function buildDocPatch(unusedTokens) {
  return {
    file: DESIGN_MD,
    unused: unusedTokens,
    insertMarker:
      "**Tailwind v4 `@theme`:** Todos los tokens expuestos como utilidades Tailwind en `@theme inline`.",
    newSection: renderDeprecatedSection(unusedTokens),
  };
}

function renderDeprecatedSection(unusedTokens) {
  const today = new Date().toISOString().slice(0, 10);
  const groups = {
    "Spacing scale (legacy)": unusedTokens.filter((t) => t.startsWith("space-")),
    "Layout gutters": unusedTokens.filter((t) => t.startsWith("gutter-")),
    Radius: unusedTokens.filter((t) => t.startsWith("radius-")),
    "Z-index reserved": unusedTokens.filter((t) => t.startsWith("z-")),
    "Motion easings": unusedTokens.filter((t) => t.startsWith("ease-")),
  };

  const lines = [];
  lines.push("");
  lines.push("");
  lines.push("### 1.5 Deprecated tokens (considerar)");
  lines.push("");
  lines.push(
    `> Generado automáticamente por \`scripts/fix-token-coverage.mjs\` el ${today} a partir del JSON de \`audit-token-coverage\`. **Estos tokens están definidos en \`design-tokens.css\` pero nunca son referenciados vía \`var(--*)\` ni utility expuesta.** Sin uso: candidatos a deprecation. Aplicar opción A (consolidar en otro existente) o B (eliminar y re-aparecer si surge necesidad real).`,
  );
  lines.push("");
  lines.push("| # | Token | Categoría | Decisión recomendada |");
  lines.push("|---|-------|-----------|----------------------|");
  let i = 1;
  for (const [category, tokens] of Object.entries(groups)) {
    for (const t of tokens) {
      const decision = decisionFor(t, category);
      lines.push(`| ${i++} | \`--${t}\` | ${category} | ${decision} |`);
    }
  }
  if (i === 1) {
    lines.push("| — | _(ninguno)_ | — | — |");
  }
  lines.push("");
  lines.push(
    "**No eliminar definiciones sin antes buscar callers históricos.** El script `audit-token-coverage` es source of truth; tras depurar tokens, re-correrlo debería mostrar cobertura 100% — confirmación de que no había usages latentes en sombras, gradients, o `--var(--ak-*)`.",
  );
  lines.push("");
  return lines.join("\n");
}

function decisionFor(token, category) {
  if (category === "Spacing scale (legacy)") {
    return "Consolidar en `--space-2xs/xs/sm/md/lg/xl/2xl/3xl` ya en scale (eliminar este).";
  }
  if (category === "Layout gutters") {
    return "Re-evaluar tras F18 layout responsive; eliminar si sin callers.";
  }
  if (category === "Z-index reserved") {
    return "Reservado para componentes futuros (modals, tooltips). Mantener hasta F18.";
  }
  if (category === "Radius") {
    return "Reemplazar por `--radius-*` equivalente en scale.";
  }
  if (category === "Motion easings") {
    return "Mantener hasta que surja necesidad real (e.g. CTAs énfasis).";
  }
  return "Revisar manualmente.";
}

// ───────────────────────────────────────────────────────────────────────
// Apply patches (atomic write + idempotency check)
// ───────────────────────────────────────────────────────────────────────

function applyFile(sourceFile, newContent) {
  const tmpPath = sourceFile + ".new";
  try {
    readFileSync(tmpPath, "utf-8"); // sanity: shouldn't exist prior
    console.error(`⚠️ ${tmpPath} ya existe — abortar para evitar pisar tmp antiguo`);
    return { ok: false, error: "tmp-exists" };
  } catch {
    /* ok: tmp doesn't exist */
  }

  try {
    const buf = Buffer.from(newContent, "utf-8");
    writeAtomic(tmpPath, buf);
    const written = readFileSync(tmpPath, "utf-8");
    if (written.length === 0 || written !== newContent) {
      safeUnlink(tmpPath);
      return { ok: false, error: "post-write-mismatch" };
    }
    renameAtomic(tmpPath, sourceFile);
    return { ok: true };
  } catch (e) {
    safeUnlink(tmpPath);
    return { ok: false, error: e.message };
  }
}

function writeAtomic(path, buf) {
  writeFileSync(path, buf);
}

function renameAtomic(src, dst) {
  renameSync(src, dst);
}

function safeUnlink(path) {
  try {
    unlinkSync(path);
  } catch {
    /* ok */
  }
}

// ───────────────────────────────────────────────────────────────────────
// Idempotency check
// ───────────────────────────────────────────────────────────────────────

function alreadyApplied(filePath, patches) {
  const src = readFileSync(filePath, "utf-8");
  for (const p of patches) {
    if (p.error) continue;
    const signature = `var(--${p.token},`;
    if (src.includes(signature)) return false;
  }
  return true;
}

// ───────────────────────────────────────────────────────────────────────
// DOC PATCH insertion (insert before next ## section)
// ───────────────────────────────────────────────────────────────────────

function insertIntoDesignMd(currentContent, newSectionText) {
  const markerIdx = currentContent.indexOf("**Tailwind v4 `@theme`:**");
  if (markerIdx === -1) {
    return { ok: false, error: "marker-not-found" };
  }
  const afterMarker = currentContent.slice(markerIdx);
  const nextBoundary = afterMarker.search(/\n---\n|\n##\s/);
  if (nextBoundary === -1) {
    return { ok: false, error: "boundary-not-found" };
  }
  const cutAt = markerIdx + nextBoundary;
  const before = currentContent.slice(0, cutAt);
  const after = currentContent.slice(cutAt);
  const newContent = before + "\n" + newSectionText + "\n" + after;
  return { ok: true, newContent };
}

// ───────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────

function main() {
  const audit = loadAudit();
  const violations = audit.doubleViolations || [];
  const unused = audit.unusedTokens || [];

  const sourcePatchesMap = buildSourcePatches(violations);
  const docPatch = buildDocPatch(unused);

  const summary = {
    sourcePatches: [],
    docPatch: null,
    skipped: [],
    unmappedWarnings: [],
  };

  for (const [file, patches] of sourcePatchesMap.entries()) {
    const rel = file.replace(ROOT + "/", "");
    if (patches.some((p) => p.error === "file-missing")) {
      summary.skipped.push({ file: rel, reason: "file-missing" });
      continue;
    }
    if (patches.some((p) => !p.mapping)) {
      const unmappedToken = patches.find((p) => !p.mapping)?.token;
      summary.unmappedWarnings.push({ file: rel, token: unmappedToken });
      if (STRICT) {
        console.error(`❌ Strict mode: UNMAPPED token ${unmappedToken} en ${rel}`);
        process.exit(2);
      }
    }
    if (existsSync(file) && alreadyApplied(file, patches)) {
      summary.skipped.push({ file: rel, reason: "already-applied" });
      continue;
    }
    summary.sourcePatches.push({ file: rel, patches });
  }

  if (!existsSync(docPatch.file)) {
    summary.skipped.push({ file: "docs/DESIGN.md", reason: "missing" });
  } else if (docPatch.unused.length === 0) {
    summary.skipped.push({ file: "docs/DESIGN.md", reason: "no-unused-tokens" });
  } else if (readFileSync(docPatch.file, "utf-8").includes("### 1.5 Deprecated tokens")) {
    summary.skipped.push({ file: "docs/DESIGN.md", reason: "section-already-exists" });
  } else {
    summary.docPatch = docPatch;
  }

  if (JSON_MODE) {
    process.stdout.write(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          proposed: {
            sourcePatches: summary.sourcePatches.map((sp) => ({
              file: sp.file,
              changes: sp.patches.map((p) => ({
                line: p.line,
                token: p.token,
                replacement: p.replacement,
                rational: p.rational,
              })),
            })),
            docPatch: summary.docPatch
              ? {
                  file: "docs/DESIGN.md",
                  section: "### 1.5 Deprecated tokens (considerar)",
                  tableRows: summary.docPatch.unused.length,
                }
              : null,
          },
          skipped: summary.skipped,
          warnings: summary.unmappedWarnings,
          counts: {
            sourceFiles: summary.sourcePatches.length,
            sourceChanges: summary.sourcePatches.reduce((acc, sp) => acc + sp.patches.length, 0),
            docSections: summary.docPatch ? 1 : 0,
          },
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(summary.sourcePatches.length > 0 || summary.docPatch ? 1 : 0);
  }

  const out = [];
  out.push("# 🛠 fix-token-coverage — Plan of changes");
  out.push("");
  out.push(
    `> **Mode:** ${APPLY ? "🔴 APPLY" : "🟢 DRY-RUN"} · Source files: ${summary.sourcePatches.length} · Doc sections: ${summary.docPatch ? 1 : 0}`,
  );
  out.push("");

  if (summary.sourcePatches.length > 0) {
    out.push("## 1 · Source patches");
    out.push("");
    for (const sp of summary.sourcePatches) {
      out.push(`### \`${sp.file}\``);
      for (const p of sp.patches) {
        out.push(
          `- L${p.line} (\`--${p.token}\`): \`var(--${p.token}, <fallback>)\` → \`${p.replacement}\``,
        );
        if (p.rational) out.push(`  - Rational: ${p.rational}`);
      }
      out.push("");
    }
  }

  if (summary.docPatch) {
    out.push("## 2 · Doc patch");
    out.push("");
    out.push(
      `### \`docs/DESIGN.md\` — insert new section \`### 1.5 Deprecated tokens (considerar)\``,
    );
    out.push("");
    out.push(summary.docPatch.newSection);
    out.push("");
  }

  if (summary.skipped.length > 0) {
    out.push("## 3 · Skipped (idempotency / no-op)");
    out.push("");
    for (const s of summary.skipped) {
      out.push(`- \`${s.file}\`: ${s.reason}`);
    }
    out.push("");
  }

  if (summary.unmappedWarnings.length > 0) {
    out.push("## 4 · Warnings (unmapped tokens)");
    out.push("");
    out.push(
      "Los tokens siguientes aparecen en violations pero NO están en `MAPPING_TABLE`. El script",
    );
    out.push("propone conservadamente `var(--token)` sin fallback (preserva el behavior actual).");
    out.push("Añadir entrada en MAPPING_TABLE antes de --apply si quieres reemplazo canónico:");
    out.push("");
    for (const u of summary.unmappedWarnings) {
      out.push(`- \`${u.token}\` en \`${u.file}\``);
    }
    out.push("");
  }

  if (summary.sourcePatches.length === 0 && !summary.docPatch && summary.skipped.length === 0) {
    out.push("✅ **Nada que parchar.** El repo está limpio según el audit más reciente.");
  } else if (!APPLY) {
    out.push("---");
    out.push("");
    out.push(`ℹ️  DRY-RUN. Re-corre con \`--apply\` para escribir los patches atómicamente.`);
  }

  process.stdout.write(out.join("\n") + "\n");

  if (!APPLY) {
    process.exit(summary.sourcePatches.length > 0 || summary.docPatch ? 1 : 0);
  }

  let appliedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const sp of summary.sourcePatches) {
    const file = resolve(ROOT, sp.file);
    const src = readFileSync(file, "utf-8");
    const patches = sp.patches;
    const { result, applied } = applyLocalPatches(src, patches);
    if (applied === 0) {
      errors.push({ file: sp.file, reason: "no-applied" });
      continue;
    }
    const writeResult = applyFile(file, result);
    if (writeResult.ok) {
      appliedCount += applied;
      console.log(`✓ ${sp.file}: ${applied} patch(es)`);
    } else {
      errorCount++;
      errors.push({ file: sp.file, reason: writeResult.error });
      console.error(`✗ ${sp.file}: ${writeResult.error}`);
    }
  }

  if (summary.docPatch) {
    const src = readFileSync(docPatch.file, "utf-8");
    const insertion = insertIntoDesignMd(src, docPatch.newSection);
    if (insertion.ok) {
      const writeResult = applyFile(docPatch.file, insertion.newContent);
      if (writeResult.ok) {
        appliedCount += docPatch.unused.length;
        console.log(`✓ docs/DESIGN.md: +§1.5 (${docPatch.unused.length} tokens)`);
      } else {
        errorCount++;
        errors.push({ file: "docs/DESIGN.md", reason: writeResult.error });
        console.error(`✗ docs/DESIGN.md: ${writeResult.error}`);
      }
    } else {
      errorCount++;
      errors.push({ file: "docs/DESIGN.md", reason: insertion.error });
      console.error(`✗ docs/DESIGN.md: ${insertion.error}`);
    }
  }

  console.log("");
  console.log(`─── Resumen apply ───`);
  console.log(`Patches aplicados:    ${appliedCount}`);
  console.log(`Errores:              ${errorCount}`);
  console.log(`Skipped (idempotent): ${summary.skipped.length}`);
  if (errors.length > 0) {
    console.log(`Detalle errores:`);
    for (const e of errors) console.log(`  - ${e.file}: ${e.reason}`);
    process.exit(1);
  }
  process.exit(0);
}

main();
