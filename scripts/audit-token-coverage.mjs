#!/usr/bin/env node
/**
 * audit-token-coverage.mjs
 *
 * Auto-validador del design token system del proyecto Arctic Ocean.
 * Complementa `scripts/audit-hardcoded-colors.mjs` añadiendo 3 dimensiones que
 * aquél no cubre:
 *
 *   (a) TOKENS REFERENCIADOS: lista todos los tokens (`var(--*)`) usados en el
 *       código, con archivos + líneas + contexto.
 *   (b) TOKENS NO USADOS: tokens definidos en `design-tokens.css` (light o
 *       dark) que NUNCA son referenciados vía `var(--*)` ni vía utility
 *       exposed en `@theme inline` (e.g. `bg-cta`, `text-on-primary`) en
 *       ningún .tsx ni .css. Candidatos a deprecation.
 *   (c) LITERALES EN CLASSNAMES: className strings con valores literales
 *       hardcoded tipo `w-[44px]`, `h-[1.5rem]`, o utilities Tailwind
 *       palette-no-canónica (`text-emerald-500`, `bg-zinc-900`) que no
 *       matchean los tokens del design system. = HC nuevos no documentados.
 *
 * Cascada de scan: `.tsx` ∪ `.css` (muchos tokens se consumen via
 * `bg-cta` → CSS `background: hsl(var(--cta))`).
 *
 * Output:
 *   node scripts/audit-token-coverage.mjs          # exit 0/1 + markdown dashboard
 *   node scripts/audit-token-coverage.mjs --json   # exit 0/1 + JSON output
 *   node scripts/audit-token-coverage.mjs --strict # CI gate: exit 1 si violations
 *                                                  # OR deprecation candidates
 *
 * Flags:
 *   --json   Output JSON estable para consumers (CI pipelines, dashboards).
 *   --strict Eleva info-only signals (deprecation candidates = unused tokens) a
 *            exit-code-1 además de violations. Útil como gate de CI para
 *            detectar drift silencioso en el token system.
 *
 * Exit codes:
 *   0 — sin violations y (sin --strict o sin deprecation candidates).
 *   1 — ≥1 violation; o --strict activo con unused tokens > 0.
 *   2 — error fatal (design-tokens.css no encontrado, etc.)
 *
 * Para el user task F3 era obtener:
 *   - Lista de tokens referenciados con su uso.
 *   - Lista de tokens definidos pero nunca usados (deprecation candidates).
 *   - Lista de literales en className (HC nuevos).
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ARGS = new Set(process.argv.slice(2));
const JSON_MODE = ARGS.has("--json");
const STRICT = ARGS.has("--strict");

/**
 * Tokens intencionalmente reservados (no legacy ni deprecation candidates).
 * Se definen en CSS para uso futuro y no tienen referencias activas.
 * No deben causar failure en modo --strict.
 * Actualizado post-F19: ease-bounce + z-modal/overlay/sticky/tooltip.
 */
const INTENTIONALLY_RESERVED = new Set([
  "ease-bounce",
  "z-modal",
  "z-overlay",
  "z-sticky",
  "z-tooltip",
]);

// ───────────────────────────────────────────────────────────────────────
// Paths
// ───────────────────────────────────────────────────────────────────────

const TOKENS_CSS = resolve(ROOT, "src/styles/design-tokens.css");
const SRC_DIR = resolve(ROOT, "src");

const EXCLUDE_PREFIXES = [
  "node_modules/",
  ".next/",
  ".git/",
  "scripts/", // este y otros audit scripts contienen regex de ejemplo
  "tests/", // fixtures pueden tener literales a propósito
];

const TARGET_EXTS = new Set(["tsx", "ts", "css", "mjs"]);

// ───────────────────────────────────────────────────────────────────────
// Tailwind framework utilities — IGNORAR (no son HC, son framework)
// ───────────────────────────────────────────────────────────────────────

// JS literal regex NO admite saltos de línea. Construyo via RegExp(string) con
// un template literal multi-línea para mantener legibilidad.
// NOTA: JS no soporta flag 'x' (extended mode es Perl-only), pero el template literal
// está construido sin whitespace residual, así que es semánticamente equivalente.
const TAILWIND_FRAMEWORK_UTILS = new RegExp(
  `^(?:` +
    `p[trblxy]?-\\d+(?:\\.\\d+)?$|` +
    `m[trblxy]?-\\d+(?:\\.\\d+)?$|` +
    `gap-\\d+(?:\\.\\d+)?$|` +
    `space-(x|y)?-?\\d+(?:\\.\\d+)?$|` +
    `w-\\d+(?:\\.\\d+)?$|` +
    `h-\\d+(?:\\.\\d+)?$|` +
    `min-w-\\d+$|` +
    `max-w-\\d+$|` +
    `min-h-\\d+$|` +
    `max-h-\\d+$|` +
    `flex(?:-?\\d+)?$|flex-(row|col|wrap)(?:-?reverse)?$|` +
    `grid(?:-cols-\\d+)?$|` +
    `block$|inline$|inline-block$|hidden$|table$|sr-only$|` +
    `absolute$|relative$|fixed$|sticky$|static$|` +
    `z-\\d+$|` +
    `rounded(-[a-z]+)?(-\\d+)?$|` +
    `border(-\\d+)?$|` +
    `shadow-(sm|md|lg|xl|2xl|inner|none)$|` +
    `ring(-\\d+)?$|` +
    `text-(sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|xs|left|center|right|justify|wrap|nowrap|balance|ellipsis)$|` +
    `leading-\\d+$|` +
    `font-(thin|light|normal|medium|semibold|bold|extrabold|black|sans|serif|mono)$|` +
    `tracking-\\d+$|` +
    `transition(-all|-colors|-opacity|-transform|-shadow|-none)?(-\\d+)?$|` +
    `duration-\\d+$|` +
    `ease-(linear|in|out|in-out)$|` +
    `col-span-\\d+$|` +
    `row-span-\\d+$|` +
    `list-(none|disc|decimal)$|` +
    `object-(cover|contain|none|fill|scale-down)$|` +
    `cursor-[a-z]+$|` +
    `pointer-events-(none|auto)$|` +
    `select-(none|text|all)$|` +
    `italic$|underline$|line-through$|uppercase$|lowercase$|capitalize$|` +
    `whitespace-(normal|nowrap|pre|pre-line|pre-wrap)$|` +
    `break-after-[a-z]+$|` +
    `break-before-[a-z]+$|` +
    `overflow-(auto|hidden|visible|scroll|x|y)$|` +
    `opacity-\\d+$|` +
    `hover:[a-z-]+$|` +
    `focus:[a-z-]+$|` +
    `active:[a-z-]+$|` +
    `disabled:[a-z-]+$|` +
    `dark:[a-z-]+$|` +
    `group(?:-[a-z]+)?-$|` +
    `aria-[a-z]+:[a-z-]+$|` +
    `data-\\[[^\\]]+\\]:[a-z-]+$` +
    `)`,
);

// ───────────────────────────────────────────────────────────────────────
// Token recognition — qué nombres de tokens reconocer en className utilities
// ───────────────────────────────────────────────────────────────────────

/**
 * Extrae nombre de token del final del @theme inline block en design-tokens.css.
 * Para `bg-X`, `text-X`, `border-X`, `shadow-X`, `ring-X` reconocer X como
 * candidato a token.
 */
const TAILWIND_TOKEN_UTILS =
  /^(text|bg|border|ring|shadow|decoration|accent|caret|outline|fill|stroke|divide|placeholder)-(.+)$/;

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

function readSafe(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

function walkSrc(dir = SRC_DIR, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full, acc);
    else if (entry.isFile() && TARGET_EXTS.has(entry.name.split(".").pop())) {
      // Filter excludes
      const rel = relative(ROOT, full).replace(/\\/g, "/");
      if (EXCLUDE_PREFIXES.some((p) => rel.startsWith(p))) continue;
      acc.push(full);
    }
  }
  return acc;
}

/** Comentarios block JS/TS/CSS + single-line //, # — strippear antes del scan */
function stripComments(src, ext) {
  let out = src;
  // /* ... */  multi-línea (CSS + JSDoc)
  out = out.replace(/\/\*[\s\S]*?\*\//g, "");
  // // ... single-line (TS/JS); sólo fuera de strings.
  // Conservador: línea por línea, sin tocar strings (antigua simplificación).
  out = out
    .split("\n")
    .map((line) => {
      // cortar en // si NO estamos dentro de un string.
      const idx = findUnquotedCommentMarker(line);
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
  return out;
}

/** Busca índice de `//` fuera de strings/JSX. Conservador. */
function findUnquotedCommentMarker(line) {
  let inSingle = false,
    inDouble = false,
    inBacktick = false,
    inJsx = false;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    const next = line[i + 1];
    if (c === "'" && !inDouble && !inBacktick) inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick) inDouble = !inDouble;
    else if (c === "`" && !inSingle && !inDouble) inBacktick = !inBacktick;
    else if (!inSingle && !inDouble && !inBacktick && c === "/" && next === "/") return i;
  }
  return -1;
}

/**
 * Parsea el bloque `@theme inline` en design-tokens.css y extrae los nombres
 * de tokens que están expuestos como utilities Tailwind (e.g. `--color-cta`
 * → utility `bg-cta`, `text-cta`). Devuelve Set<string>.
 */
function parseThemeInlineTokens(tokensCss) {
  const themeBlock = /@theme\s+inline\s*\{[\s\S]*?\n\}/m.exec(tokensCss);
  if (!themeBlock) return new Set();
  const exposed = new Set();
  // matches: --color-cta: hsl(var(--cta));
  const re = /--color-([a-zA-Z0-9-]+)\s*:/g;
  let m;
  while ((m = re.exec(themeBlock[0])) !== null) exposed.add(m[1]);
  return exposed;
}

/** Parsea :root (light) y .dark (dark) tokens → Set de nombres únicos */
function parseDefinedTokens(tokensCss) {
  const defined = new Map(); // name → { light, dark }
  const rootMatch = /:root\s*\{([\s\S]*?)\n\}/m.exec(tokensCss);
  const darkMatch = /\.dark\s*\{([\s\S]*?)\n\}/m.exec(tokensCss);
  const parseBlock = (block) => {
    const re = /--([a-zA-Z0-9-]+)\s*:/g;
    let m;
    while ((m = re.exec(block)) !== null) defined.set(m[1], { ...defined.get(m[1]) });
  };
  if (rootMatch) parseBlock(rootMatch[1]);
  if (darkMatch) parseBlock(darkMatch[1]);
  return defined;
}

/**
 * Scan all .tsx + .css for `var(--X)` references (with optional fallback)
 * and Tailwind-mappable className tokens like bg-cta, text-emergency.
 *
 * Returns:
 *   usedTokens: Map<token, [{file, line, context}]>
 *   doubleViolations: [{file, line, token, fallback, message}]
 *   unmappedClasses: [{class, file, line}]
 */
function scanUsage(files, exposedTokensList) {
  const usedTokens = new Map(); // tokenName → [{file, line, context}]
  const doubleViolations = [];
  const unmappedClasses = [];

  // regex pre-compiled
  // VAR_RE soporta fallbacks con paréntesis anidados (e.g. `hsl(var(--primary-400))`).
  // Antes se excluía con `[^()]+?` y silenciosamente skipeaba esos usos.
  const VAR_RE = /var\(\s*--([a-zA-Z0-9-]+)(?:\s*,\s*([\s\S]+?))?\s*\)/g;
  const CLASSNAME_BLOCK_RE = /\bclass(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;

  const pushUsed = (tokenName, file, line, context) => {
    if (!usedTokens.has(tokenName)) usedTokens.set(tokenName, []);
    usedTokens.get(tokenName).push({ file, line, context });
  };

  for (const file of files) {
    const ext = file.split(".").pop();
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    let src = readSafe(file);
    if (!src) continue;
    src = stripComments(src, ext);

    // -- 1. var(--token) references
    VAR_RE.lastIndex = 0;
    let m;
    while ((m = VAR_RE.exec(src)) !== null) {
      const token = m[1];
      const fallback = m[2];
      const lineNum = src.slice(0, m.index).split("\n").length;
      const context = src.split("\n")[lineNum - 1].trim().slice(0, 80);
      pushUsed(token, rel, lineNum, context);
      // Detect HARD-CODED FALLBACK (HC violation): if fallback contains hex/rgb literal.
      if (fallback && /#[0-9a-fA-F]{3,8}\b|\brgb\(|\brgba\(/.test(fallback)) {
        doubleViolations.push({
          file: rel,
          line: lineNum,
          token,
          fallback: fallback.trim(),
          rule: "var-with-hardcoded-fallback",
          severity: "high",
          message: `var(--${token}, ${fallback.trim()}) — fallback literal es HC latente; documentar token o eliminar fallback.`,
        });
      }
    }

    // -- 2. ClassName scan for token-mappable utilities (only for .tsx + .ts)
    if (ext === "tsx" || ext === "ts") {
      CLASSNAME_BLOCK_RE.lastIndex = 0;
      while ((m = CLASSNAME_BLOCK_RE.exec(src)) !== null) {
        const classStr = m[1] ?? m[2] ?? m[3] ?? "";
        if (!classStr) continue;
        const lineNum = src.slice(0, m.index).split("\n").length;
        for (const cls of classStr.split(/\s+/)) {
          if (!cls) continue;

          // Detect literal arbitrary values like w-[44px] or h-[1.5rem]
          const arbitraryMatch = /[a-z-]+-\[(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw)\]/.exec(cls);
          if (arbitraryMatch) {
            unmappedClasses.push({
              class: cls,
              file: rel,
              line: lineNum,
              kind: "literal-arbitrary",
              value: arbitraryMatch[0],
              message: `Valor literal ${arbitraryMatch[0]} en className — debería usar token (--space-* / --container-* / --header-height / --fs-*).`,
            });
            continue;
          }

          // Skip if Tailwind framework utility (spacing, layout, etc.)
          if (TAILWIND_FRAMEWORK_UTILS.test(cls)) continue;

          // Detect unmapped Tailwind palette colors like text-zinc-900, bg-emerald-200
          const paletteMatch =
            /^(text|bg|border|ring|shadow|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})$/;
          if (paletteMatch.test(cls)) {
            unmappedClasses.push({
              class: cls,
              file: rel,
              line: lineNum,
              kind: "tw-palette-not-in-tokens",
              message: `Tailwind palette '${cls}' — no está en design-tokens.css; usar token semántico (text-foreground, bg-cta, etc.).`,
            });
            continue;
          }

          // Try matching token-mappable utility (text-X, bg-X, etc.)
          const tm = TAILWIND_TOKEN_UTILS.exec(cls);
          if (!tm) continue;
          const [, , /*prefix*/ suffixRaw] = tm;
          const suffix = suffixRaw.split("/")[0]; // strip Tailwind opacity modifiers like cta/50
          if (exposedTokensList.includes(suffix)) {
            pushUsed(suffix, rel, lineNum, `className="${classStr.slice(0, 60)}…"`);
          } else {
            unmappedClasses.push({
              class: cls,
              file: rel,
              line: lineNum,
              kind: "unmapped-utility",
              message: `className '${cls}' contiene suffix '${suffix}' que NO está en @theme inline; no mapea a token.`,
            });
          }
        }
      }
    }
  }

  return { usedTokens, doubleViolations, unmappedClasses };
}

// ───────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(TOKENS_CSS)) {
    console.error(`❌ design-tokens.css no encontrado en ${TOKENS_CSS}`);
    process.exit(2);
  }
  const tokensCss = readFileSync(TOKENS_CSS, "utf-8");
  const definedTokens = parseDefinedTokens(tokensCss);
  const exposedTokens = parseThemeInlineTokens(tokensCss);
  const files = walkSrc();
  const { usedTokens, doubleViolations, unmappedClasses } = scanUsage(files, [...exposedTokens]);

  // Compute derived metrics
  const usedTokenCount = usedTokens.size;
  const definedTokenCount = definedTokens.size;
  const unusedAll = [...definedTokens.keys()].filter((t) => !usedTokens.has(t));
  const unusedTokens = unusedAll.filter((t) => !INTENTIONALLY_RESERVED.has(t));
  const reservedTokens = unusedAll.filter((t) => INTENTIONALLY_RESERVED.has(t));
  const coveragePercent =
    definedTokenCount > 0 ? Math.round((usedTokenCount / definedTokenCount) * 100) : 0;

  const violations = doubleViolations.length + unmappedClasses.length;

  if (JSON_MODE) {
    const out = {
      generated: new Date().toISOString(),
      root: ROOT,
      coverage: {
        defined: definedTokenCount,
        used: usedTokenCount,
        unused: unusedTokens.length,
        coveragePercent: `${coveragePercent}%`,
      },
      usedTokens: Object.fromEntries(
        [...usedTokens.entries()].sort().map(([tok, hits]) => [
          tok,
          {
            count: hits.length,
            files: [...new Set(hits.map((h) => h.file))],
            hits: hits.slice(0, 10), // truncate for JSON readability
          },
        ]),
      ),
      unusedTokens: unusedTokens.sort(),
      reservedTokens: reservedTokens.sort(),
      doubleViolations,
      unmappedClasses,
      violations: {
        count: violations,
        byKind: {
          "var-with-hardcoded-fallback": doubleViolations.length,
          "literal-arbitrary": unmappedClasses.filter((c) => c.kind === "literal-arbitrary").length,
          "tw-palette-not-in-tokens": unmappedClasses.filter(
            (c) => c.kind === "tw-palette-not-in-tokens",
          ).length,
          "unmapped-utility": unmappedClasses.filter((c) => c.kind === "unmapped-utility").length,
        },
      },
      totals: { filesScanned: files.length, tokensExposedInTheme: exposedTokens.size },
    };
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    // Sin --strict: exit 1 sólo si hay violations reales. Con --strict: exit 1 también
    // si hay unused tokens (deprecation candidates) — eleva info-only a failure para CI.
    process.exit(violations > 0 || (STRICT && unusedTokens.length > 0) ? 1 : 0);
  }

  // Markdown dashboard
  const lines = [];
  lines.push(`# 🎨 Audit Token Coverage & Design System Usage`);
  lines.push("");
  lines.push(
    `> Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC · Scanned ${files.length} files in src/`,
  );
  lines.push("");

  // Summary
  lines.push("## 1 · Resumen ejecutivo");
  lines.push("");
  lines.push("| Métrica | Valor |");
  lines.push("|---|---|");
  lines.push(`| Tokens definidos en design-tokens.css | ${definedTokenCount} |`);
  lines.push(`| Tokens referenciados (var(--*) + utility exposed) | ${usedTokenCount} |`);
  lines.push(`| **Cobertura** | **${coveragePercent}%** |`);
  lines.push(`| Tokens no usados (deprecation candidates) | ${unusedTokens.length} |`);
  lines.push(`| Fallbacks hardcoded en \`var(--x, literal)\` | ${doubleViolations.length} |`);
  lines.push(
    `| Literales arbitrarios en className ([44px]) | ${unmappedClasses.filter((c) => c.kind === "literal-arbitrary").length} |`,
  );
  lines.push(
    `| Utilities Tailwind palette no en tokens | ${unmappedClasses.filter((c) => c.kind === "tw-palette-not-in-tokens").length} |`,
  );
  lines.push(
    `| Utilities no mapeadas a tokens | ${unmappedClasses.filter((c) => c.kind === "unmapped-utility").length} |`,
  );
  lines.push(`| **Violations totales** | **${violations}** |`);
  lines.push("");

  // (a) Tokens usados
  lines.push("## 2 · (a) Tokens referenciados y su uso");
  lines.push("");
  lines.push(
    `Total: **${usedTokenCount}** tokens referenciados en \`var(--*)\` o utility className.`,
  );
  lines.push("");
  lines.push("| Token | Conteo | Files donde aparece |");
  lines.push("|---|---:|---|");
  const sortedUsed = [...usedTokens.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [tok, hits] of sortedUsed) {
    const files = [...new Set(hits.map((h) => h.file))];
    lines.push(
      `| \`${tok}\` | ${hits.length} | ${files.map((f) => "`" + f.split("/").pop() + "`").join(", ")} |`,
    );
  }
  lines.push("");

  // (b) Tokens no usados
  lines.push("## 3 · (b) Tokens definidos pero no usados (deprecation candidates)");
  lines.push("");
  if (unusedAll.length === 0) {
    lines.push("✅ **Todos los tokens definidos tienen al menos un uso.**");
  } else {
    if (unusedTokens.length > 0) {
      lines.push(
        `**${unusedTokens.length} tokens** en \`design-tokens.css\` sin referencia alguna (excluyendo ${reservedTokens.length} intencionalmente reservados). Sugerencia: revisar si fueron duplicados o expansiones F2.1 (type scale, layout) que nunca llegaron a usarse.`,
      );
      lines.push("");
      lines.push("```");
      const cols = 4;
      const perCol = Math.ceil(unusedTokens.length / cols);
      const colRows = Array.from({ length: perCol }, () => []);
      unusedTokens.forEach((t, i) => colRows[Math.floor(i / cols)].push(t));
      for (let r = 0; r < perCol; r++) {
        const row = colRows.map((c) => (c[r] || "").padEnd(28)).join(" ");
        lines.push(row.trimEnd());
      }
      lines.push("```");
    }
    if (reservedTokens.length > 0) {
      if (unusedTokens.length === 0) {
        lines.push(
          "✅ **Sin tokens legacy sin usar.** Los tokens sin uso activo están intencionalmente reservados:",
        );
      } else {
        lines.push("");
        lines.push("**Reservados intencionalmente** (no cuentan como deprecation):");
      }
      lines.push("");
      lines.push("```");
      const cols = 4;
      const perCol = Math.ceil(reservedTokens.length / cols);
      const colRows = Array.from({ length: perCol }, () => []);
      reservedTokens.forEach((t, i) => colRows[Math.floor(i / cols)].push(t));
      for (let r = 0; r < perCol; r++) {
        const row = colRows.map((c) => (c[r] || "").padEnd(28)).join(" ");
        lines.push(row.trimEnd());
      }
      lines.push("```");
    }
  }
  lines.push("");

  // (c) Literales en className
  lines.push("## 4 · (c) Literales / utilities no documentadas en className");
  lines.push("");
  if (unmappedClasses.length === 0 && doubleViolations.length === 0) {
    lines.push("✅ **Sin literales hardcoded ni utilities no mapeadas en className.**");
  } else {
    lines.push("### 4.1 — Doble violation: `var(--x, literal)` con fallback hardcoded");
    lines.push("");
    if (doubleViolations.length === 0) {
      lines.push("✅ Sin esta violation.");
    } else {
      for (const v of doubleViolations) {
        lines.push(
          `- ❌ \`${v.file}:${v.line}\` → \`var(--${v.token}, ${v.fallback})\` — ${v.message}`,
        );
      }
    }
    lines.push("");
    lines.push("### 4.2 — Literales arbitrarios en className `[44px]`, `[1.5rem]`, etc.");
    lines.push("");
    const lits = unmappedClasses.filter((c) => c.kind === "literal-arbitrary");
    if (lits.length === 0) {
      lines.push("✅ Sin literales arbitrarios.");
    } else {
      for (const v of lits) {
        lines.push(`- ❌ \`${v.file}:${v.line}\` → \`${v.class}\` (${v.value}) — ${v.message}`);
      }
    }
    lines.push("");
    lines.push("### 4.3 — Tailwind palette no en tokens (`text-zinc-900`, `bg-emerald-200`)");
    lines.push("");
    const palettes = unmappedClasses.filter((c) => c.kind === "tw-palette-not-in-tokens");
    if (palettes.length === 0) {
      lines.push("✅ Sin uso de Tailwind palette; todos los colores vienen de tokens.");
    } else {
      for (const v of palettes) {
        lines.push(`- ❌ \`${v.file}:${v.line}\` → \`${v.class}\` — ${v.message}`);
      }
    }
    lines.push("");
    lines.push("### 4.4 — Utilities no mapeadas (suffix no en @theme inline)");
    lines.push("");
    const unmapped = unmappedClasses.filter((c) => c.kind === "unmapped-utility");
    if (unmapped.length === 0) {
      lines.push("✅ Sin utilities no mapeadas.");
    } else {
      for (const v of unmapped) {
        lines.push(`- ❌ \`${v.file}:${v.line}\` → \`${v.class}\` — ${v.message}`);
      }
    }
    lines.push("");
  }

  // Footer
  lines.push("## 5 · Cómo interpretar");
  lines.push("");
  lines.push(
    `- **Cobertura ${coveragePercent}%** mide proportion de tokens \`design-tokens.css\` que tienen al menos una referencia. 100% ideal; <80% indica tokens huérfanos que probablemente deberían deprecarse o consolidarse.`,
  );
  lines.push(
    `- **Violations (cualquier count > 0)** indican HC latentes en código cliente — no hay tests automáticos que los cachen, son deuda visible sólo por inspección manual.`,
  );
  lines.push(
    `- **Re-run anytime**: este script es read-only y rápido (<1s). Integra en CI para detectar regresiones de token usage en cada PR.`,
  );
  lines.push("");

  process.stdout.write(lines.join("\n"));
  process.exit(violations > 0 || (STRICT && unusedTokens.length > 0) ? 1 : 0);
}

main();
