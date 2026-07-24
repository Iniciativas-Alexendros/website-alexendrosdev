#!/usr/bin/env node
/**
 * audit-design-system.mjs
 *
 * Orquestador de los 3 audit scripts hermanos del design system. Combina:
 *
 *   1. `audit-token-coverage.mjs`     — cobertura tokens definidos vs usados + violations.
 *   2. `audit-hardcoded-colors.mjs`   — colores hardcoded (#fff, hex, rgb(), hsl() literal).
 *   3. `audit-spec-coherence.mjs`     — coherencia RF↔AC↔TU/TE/TS del spec `design-system-truth`.
 *
 * Emite un scoreboard unificado (markdown humano + JSON para CI) con un score
 * global ponderado. Diseño (peso 40% spec / 30% tokens / 30% colors) justificado
 * en decisiones del thinker (`spec` es la fuente de verdad; tokens + colors son
 * realidad del código que debe alinearse con el spec).
 *
 * Uso:
 *   node scripts/audit-design-system.mjs                  # markdown scoreboard a stdout
 *   node scripts/audit-design-system.mjs --json           # JSON stable a stdout
 *   node scripts/audit-design-system.mjs --out=docs/...   # markdown a archivo + stdout
 *   node scripts/audit-design-system.mjs --strict         # propaga --strict a sub-audits
 *   node scripts/audit-design-system.mjs --spec=specs/<otro>  # override spec dir
 *   node scripts/audit-design-system.mjs --help
 *
 * Exit codes (Math.max de los exit codes de los 3 sub-audits; Unix "peor gana"):
 *   0 — todos los sub-audits clean
 *   1 — al menos un sub-audit reportó violations/orphans
 *   2 — al menos un sub-audit crashed (fatal) — script no encontrado, JSON parse fail, etc.
 *
 * JSON schema estable:
 *   {
 *     generated: ISO timestamp,
 *     score: 0-100 | null,
 *     scoreBreakdown: { tokens, colors, spec, weights: {tokens:0.3, colors:0.3, spec:0.4} },
 *     exitCode: 0|1|2,
 *     status: "ok" | "error",
 *     audits: {
 *       tokens: { status, exitCode, score, payload: {...script JSON...}, error?: string },
 *       colors: { status, exitCode, score, payload: {...}, error?: string },
 *       spec:   { status, exitCode, score, payload: {...}, error?: string }
 *     }
 *   }
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ────────────────────────────────────────────────────────────────────────
// Args
// ────────────────────────────────────────────────────────────────────────

const RAW_ARGS = process.argv.slice(2);

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const found = RAW_ARGS.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const hasFlag = (flag) => RAW_ARGS.includes(flag);

const JSON_MODE = hasFlag("--json");
const STRICT = hasFlag("--strict");
const HELP = hasFlag("--help") || hasFlag("-h");
const OUT_PATH = getArg("out", null);
const SPEC_DIR = getArg("spec", "specs/design-system-truth");

// ────────────────────────────────────────────────────────────────────────
// Config — sub-scripts + pesos del score global
// ────────────────────────────────────────────────────────────────────────

const SCRIPTS_DIR = resolve(__dirname);
const SUB_AUDITS = [
  {
    key: "tokens",
    script: "audit-token-coverage.mjs",
    // tokens audit tiene su propio --strict; lo propagamos
    buildArgs: () => (STRICT ? ["--strict"] : []),
  },
  {
    key: "colors",
    script: "audit-hardcoded-colors.mjs",
    buildArgs: () => [],
  },
  {
    key: "spec",
    script: "audit-spec-coherence.mjs",
    // spec-coherence acepta directorio del spec como positional + flag --strict
    buildArgs: () => {
      const args = [SPEC_DIR];
      if (STRICT) args.push("--strict");
      return args;
    },
  },
];

const WEIGHTS = { tokens: 0.3, colors: 0.3, spec: 0.4 };

// ────────────────────────────────────────────────────────────────────────
// Help (definida al final del archivo tras dependencias — JS function hoist)
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Run a single sub-audit (parallel-safe via execFileP)
// ────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta un sub-audit script con `node <script> <args...> --json`. Devuelve
 * `{ status, exitCode, score, payload, error }`:
 *   - status: "ok" | "fatal"
 *   - exitCode: 0|1|2 según el sub-script (exit 2 reservado para errores de infra
 *     propios del orquestador: script no encontrado, JSON vacío, stderr fatal, etc.)
 *   - payload: el JSON parseado del sub-script si todo fue bien
 *   - score: 0-100 calculado según el dominio del sub-audit (o null si fatal)
 *   - error: stderr capturado si status === "fatal"
 *
 * Estrategia defensiva: incluso si el sub-script exit=1 (violations), los datos
 * siguen siendo útiles → preservamos el payload. Sólo exit sin output parseable
 * se considera fatal.
 */
async function runSubAudit({ key, script, buildArgs }) {
  const scriptPath = resolve(SCRIPTS_DIR, script);
  const args = [...buildArgs(), "--json"];
  const result = {
    key,
    script,
    status: "ok",
    exitCode: 0,
    score: null,
    payload: null,
    error: null,
  };
  try {
    const { stdout, stderr } = await execFileP("node", [scriptPath, ...args], {
      cwd: ROOT,
      maxBuffer: 32 * 1024 * 1024,
      timeout: 60_000,
    });
    const trimmed = (stdout || "").trim();
    if (!trimmed) {
      result.status = "fatal";
      result.exitCode = 2;
      result.error = `empty stdout from ${script}`;
      return result;
    }
    let payload;
    try {
      payload = JSON.parse(trimmed);
    } catch (parseErr) {
      result.status = "fatal";
      result.exitCode = 2;
      result.error = `json parse failed (${parseErr.message}); stderr=${stderr?.slice(0, 200) || "n/a"}`;
      return result;
    }
    result.payload = payload;
    // success-path: subprocess exited cleanly, exit=0. No heuristic needed.
    result.exitCode = 0;
    result.score = computeSubScore(key, payload);
  } catch (err) {
    // execFile rejected: el sub-script exit ≠ 0 (incluyendo exit 1 con violations)
    // o se throw por timeout / ENOENT. Preservamos lo que podamos.
    //
    // IMPORTANTE: orden de checks — timeout (SIGTERM-killed subprocess) viene
    // ANTES de err.signal porque execFile con `timeout` mata via SIGTERM, que
    // también activa `err.signal`. Si signal fuera primero, el timeout se
    // clasificaría como "killed by signal SIGTERM" sin la palabra "timeout".
    if (err.code === "ENOENT") {
      result.status = "fatal";
      result.exitCode = 2;
      result.error = `script not found: ${scriptPath}`;
      return result;
    }
    if (err.killed && err.timedOut) {
      result.status = "fatal";
      result.exitCode = 2;
      result.error = `timeout 60s killed subprocess`;
      return result;
    }
    if (err.signal) {
      result.status = "fatal";
      result.exitCode = 2;
      result.error = `killed by signal ${err.signal}`;
      return result;
    }
    // Sub-script exit != 0 (subprocess reporta exit code en err.status) pero
    // emitió JSON parseable en stdout (caso normal cuando hay violations).
    // USO DIRECTO err.status: exit code literal del sub-script, NO heurística.
    const stdoutRaw = (err.stdout || "").trim();
    if (stdoutRaw) {
      try {
        const payload = JSON.parse(stdoutRaw);
        result.payload = payload;
        result.exitCode = typeof err.status === "number" ? err.status : 1;
        result.score = computeSubScore(key, payload);
        return result;
      } catch {
        /* fallthrough → fatal */
      }
    }
    // Sin payload parseable: es un fatal real. Si err.status está indefinido
    // (spawn fail antes de que subprocess reporte exit code), default = 2
    // (fatal orquestador) — NUNCA 1, que conflata con violations detectadas.
    result.status = "fatal";
    result.exitCode = typeof err.status === "number" ? err.status : 2;
    const stderrSnippet = (err.stderr || "").slice(0, 400);
    result.error = `exit ${err.status ?? "?"} without parseable JSON; stderr=${stderrSnippet || "(empty)"}`;
  }
  return result;
}

/**
 * Cuenta violations normalizadas al dominio del sub-audit:
 *   - tokens: violations.count (suma de doubleViolations + unmappedClasses)
 *   - colors: violations.length
 *   - spec: orphans.length (huérfanos = tests prometidos no entregados)
 */
function countViolations(key, payload) {
  if (!payload) return 0;
  if (key === "tokens") return payload?.violations?.count ?? 0;
  if (key === "colors") return Array.isArray(payload?.violations) ? payload.violations.length : 0;
  if (key === "spec")
    return Array.isArray(payload?.reality?.orphans) ? payload.reality.orphans.length : 0;
  return 0;
}

/**
 * Score 0-100 según dominio:
 *   - tokens: coverage.coveragePercent (entered as '93%' → strip → 93)
 *   - colors: 100 - (violations * 10) clamped [0,100]
 *   - spec:   coherence.score (ya 0-100)
 */
function computeSubScore(key, payload) {
  if (!payload) return null;
  if (key === "tokens") {
    const cp = String(payload?.coverage?.coveragePercent ?? "0%");
    const n = parseInt(cp.replace("%", ""), 10);
    return Number.isFinite(n) ? clamp(n, 0, 100) : null;
  }
  if (key === "colors") {
    const v = countViolations("colors", payload);
    return clamp(100 - v * 10, 0, 100);
  }
  if (key === "spec") {
    const s = payload?.coherence?.score;
    return Number.isFinite(s) ? clamp(s, 0, 100) : null;
  }
  return null;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// ────────────────────────────────────────────────────────────────────────
// Aggregate global score + status
// ────────────────────────────────────────────────────────────────────────

function aggregate(results) {
  // Score global ponderado con REDISTRIBUCIÓN de pesos cuando un sub-audit
  // está fatal. Si 1 de los 3 falla fatalmente, redistribuimos su peso
  // proporcionalmente entre los sobrevivientes para que el score siga siendo
  // comparativo run-a-run (max alcanzable sigue siendo 100%).
  //
  // Trade-off: el dev puede NO notar que un sub-audit es fatal si el score
  // aparece alto — por eso el semáforo 🔴 ERROR en el row y `status: 'error'`
  // global alertan explícitamente.
  const breakdown = {};
  let total = 0;
  let declaredWeight = 0;
  for (const r of results) {
    breakdown[r.key] = r.score; // null si fatal, número si OK
    const source = r.score ?? 0;
    total += source * WEIGHTS[r.key];
    declaredWeight += WEIGHTS[r.key];
  }
  const survivingWeight = results
    .filter((r) => r.score != null)
    .reduce((sum, r) => sum + WEIGHTS[r.key], 0);
  let score = null;
  if (survivingWeight === 0) {
    score = null; // todos fatales → score es null
  } else if (survivingWeight >= declaredWeight - 1e-9) {
    score = Math.round(total); // todos sobrevivieron, denominador 1.0
  } else {
    // Redistribuir: dividir entre pesos supervivientes para mantener 0-100.
    score = Math.round(total / survivingWeight);
  }
  const exitCode = results.reduce((acc, r) => Math.max(acc, r.exitCode), 0);
  const status = results.some((r) => r.status === "fatal") ? "error" : "ok";
  return {
    score,
    scoreBreakdown: breakdown,
    weights: WEIGHTS,
    survivingWeight: survivingWeight === declaredWeight ? null : survivingWeight,
    exitCode,
    status,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Visual indicators
// ────────────────────────────────────────────────────────────────────────

function scoreEmoji(score) {
  if (score == null) return "🔴 ERROR";
  if (score >= 80) return "🟢";
  if (score >= 50) return "🟡";
  return "🔴";
}

function statusEmoji(result) {
  if (result.status === "fatal") return "🔴 ERROR";
  if (result.exitCode === 0) return "🟢";
  if (result.exitCode === 1) return "🟡";
  return "🔴";
}

function pctOrDash(score) {
  return score == null ? "—" : `${score}%`;
}

// ────────────────────────────────────────────────────────────────────────
// Markdown rendering
// ────────────────────────────────────────────────────────────────────────

function renderMarkdown(global, results) {
  const lines = [];
  lines.push(`# 🎯 Design System Scoreboard`);
  lines.push("");
  lines.push(
    `> Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC · Spec: \`${SPEC_DIR}\` · Strict: ${STRICT ? "yes" : "no"}`,
  );
  lines.push("");

  // 0. Header global
  lines.push(`## 0 · Score global`);
  lines.push("");
  if (global.survivingWeight != null) {
    lines.push(
      `> ⚠️ Sub-audit fatal detectado. Pesos redistribuidos proporcionalmente entre supervivientes; max alcanzable sigue siendo 100%.`,
    );
    lines.push("");
  }
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(
    `| **Score global (ponderado)** | **${scoreEmoji(global.score)} ${global.score ?? "—"}** |`,
  );
  for (const r of results) {
    lines.push(`| ${labelOf(r.key)} | ${statusEmoji(r)} ${pctOrDash(r.score)} |`);
  }
  lines.push(`| Status | ${global.status === "ok" ? "✅ ok" : "❌ error"} |`);
  lines.push(`| Exit code (max) | \`${global.exitCode}\` |`);
  lines.push("");

  // 1. Summary ponderado
  lines.push(`## 1 · Resumen ponderado`);
  lines.push("");
  lines.push(`Pesos del thinker: **spec 40% · tokens 30% · colors 30%** (suma = 100%).`);
  lines.push("");
  lines.push(`| Dimensión | Peso | Score | Semáforo | Estado |`);
  lines.push(`|---|---:|---:|:---:|---|`);
  for (const r of results) {
    const weight = Math.round(WEIGHTS[r.key] * 100);
    lines.push(
      `| ${labelOf(r.key)} | ${weight}% | ${pctOrDash(r.score)} | ${scoreEmoji(r.score)} | ${statusEmoji(r)} |`,
    );
  }
  lines.push(
    `| **TOTAL** | **100%** | **${global.score ?? "—"}%** | **${scoreEmoji(global.score)}** | ${global.status === "ok" ? "✅" : "❌"} |`,
  );
  lines.push("");

  // 2. Detalle por sub-audit
  for (const r of results) {
    lines.push(`## 2.${results.indexOf(r) + 1} · ${labelOf(r.key)}`);
    lines.push("");
    lines.push(
      `Script: \`scripts/${r.script}\` · Exit: \`${r.exitCode}\` · Status: ${statusEmoji(r)}`,
    );
    lines.push("");
    lines.push(renderSubDetail(r));
    lines.push("");
  }

  // 3. Top issues cross-audit
  lines.push(`## 3 · Top issues (acción)`);
  lines.push("");
  lines.push(renderTopIssues(results));
  lines.push("");

  // 4. Footer
  lines.push(`## 4 · Cómo interpretar`);
  lines.push("");
  lines.push(
    `- **Score global**: media ponderada de las 3 dimensiones. Spec pesa más porque es la fuente de verdad; tokens + colors son realidad que debe alinearse con el spec.`,
  );
  lines.push(`- **Semaforo**: 🟢 ≥80% · 🟡 50-79% · 🔴 <50% · 🔴 ERROR si fatal.`);
  lines.push(
    `- **Exit code = max(3 sub-audits)**: si cualquier sub-audit falla, el orquestador falla. Unix convention "peor gana".`,
  );
  lines.push(
    `- **Error isolation**: este orquestador NO aborta si un sub-audit es fatal; completa los otros y reporta. Útil para diagnosticar multi-audit failures sin enmascarar.`,
  );
  lines.push("");
  lines.push(`---`);
  lines.push(
    `*Generado por \`scripts/audit-design-system.mjs\` v1.0 — orquestador de los 3 audit scripts hermanos.*`,
  );
  lines.push("");
  return lines.join("\n");
}

function labelOf(key) {
  return (
    { tokens: "Token coverage", colors: "Hardcoded colors", spec: "Spec coherence" }[key] || key
  );
}

function renderSubDetail(r) {
  if (r.status === "fatal") {
    return [
      `❌ **Error fatal** durante la ejecución:`,
      "",
      "```",
      r.error || "(no error message captured)",
      "```",
    ].join("\n");
  }
  const p = r.payload || {};
  if (r.key === "tokens") {
    const c = p.coverage || {};
    const v = p.violations || {};
    return [
      `| Métrica | Valor |`,
      `|---|---|`,
      `| Tokens definidos | ${c.defined ?? "—"} |`,
      `| Tokens referenciados | ${c.used ?? "—"} |`,
      `| **Cobertura** | **${c.coveragePercent ?? "—"}** |`,
      `| Tokens no usados (deprecation candidates) | ${c.unused ?? "—"} |`,
      `| **Violations totales** | **${v.count ?? 0}** |`,
      `| Files escaneados | ${p.totals?.filesScanned ?? "—"} |`,
    ].join("\n");
  }
  if (r.key === "colors") {
    const violations = Array.isArray(p.violations) ? p.violations : [];
    const byRule = new Map();
    for (const v of violations) byRule.set(v.rule, (byRule.get(v.rule) || 0) + 1);
    const ruleRows = [...byRule.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([rule, count]) => `| \`${rule}\` | ${count} |`);
    return [
      `| Métrica | Valor |`,
      `|---|---|`,
      `| Hits totales | ${p.count ?? 0} |`,
      `| Files con violations | ${new Set(violations.map((v) => v.file)).size} |`,
      ...(ruleRows.length
        ? ["", "**Distribución por rule:**", "", "| Rule | Count |", "|---|---|", ...ruleRows]
        : []),
    ].join("\n");
  }
  if (r.key === "spec") {
    const coh = p.coherence || {};
    const real = p.reality || {};
    const orphans = real.orphans || [];
    return [
      `| Métrica | Valor |`,
      `|---|---|`,
      `| Spatial coherence score | ${coh.score ?? "—"}% |`,
      `| RFs detectados | ${coh.rfCount ?? 0} |`,
      `| ACs declarados | ${coh.acDeclared ?? 0} |`,
      `| Tests unit prometidas | ${coh.tuCount ?? 0} |`,
      `| Tests e2e prometidos | ${coh.teCount ?? 0} |`,
      `| Tests scripts (TS) | ${coh.tsCount ?? 0} |`,
      `| Huérfanos (prometidos sin archivo) | ${orphans.length} |`,
      `| Tests reales en tests/unit | ${real.unitTests?.length ?? 0} |`,
      ...(orphans.length
        ? ["", "**Huérfanos detectados:**", ...orphans.slice(0, 10).map((f) => `- \`${f}\``)]
        : []),
    ].join("\n");
  }
  return "_(sin payload)_";
}

function renderTopIssues(results) {
  const issues = [];
  for (const r of results) {
    if (r.status === "fatal") {
      issues.push(`- 🔴 **${labelOf(r.key)} fatal**: ${r.error || "—"}`);
      continue;
    }
    const p = r.payload || {};
    if (r.key === "tokens") {
      const violations = (p.doubleViolations || []).concat(p.unmappedClasses || []);
      for (const v of violations.slice(0, 5)) {
        issues.push(
          `- 🟡 **tokens**: \`${v.file}:${v.line}\` → \`${v.rule || v.kind || "?"}\` — ${truncate(v.message || "", 80)}`,
        );
      }
    } else if (r.key === "colors") {
      const violations = Array.isArray(p.violations) ? p.violations : [];
      for (const v of violations.slice(0, 5)) {
        issues.push(`- 🟡 **colors**: \`${v.file}:${v.line}\` → [\`${v.rule}\`] \`${v.value}\``);
      }
    } else if (r.key === "spec") {
      const orphans = p.reality?.orphans || [];
      for (const f of orphans.slice(0, 5))
        issues.push(`- 🟡 **spec orphan**: \`${f}\` prometido en test-plan sin crear en FS`);
    }
  }
  if (issues.length === 0) {
    return `✅ Sin issues pendientes en ninguno de los 3 sub-audits.`;
  }
  return [
    `**Total issues encontrados: ${issues.length}** (mostrando top 5 por categoría):`,
    "",
    ...issues,
  ].join("\n");
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ────────────────────────────────────────────────────────────────────────
// JSON rendering (stable schema)
// ────────────────────────────────────────────────────────────────────────

function renderJson(global, results) {
  const out = {
    generated: new Date().toISOString(),
    specDir: SPEC_DIR,
    strict: STRICT,
    score: global.score,
    scoreBreakdown: global.scoreBreakdown,
    weights: global.weights,
    // survivingWeight: null si todos OK, número <1.0 si sub-audit fatal.
    // Consumers CI lo usan para detectar redistribution activa (recomparable
    // run-a-run con max=100 cuando fatal).
    survivingWeight: global.survivingWeight,
    exitCode: global.exitCode,
    status: global.status,
    audits: {},
  };
  for (const r of results) {
    out.audits[r.key] = {
      script: r.script,
      status: r.status,
      exitCode: r.exitCode,
      score: r.score,
      payload: r.payload,
      error: r.error,
    };
  }
  return JSON.stringify(out, null, 2);
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main() {
  if (HELP) {
    printHelp();
    process.exit(0);
  }

  // Reject --out + --json collision to avoid silently writing JSON to a .md path.
  if (JSON_MODE && OUT_PATH) {
    console.error(
      `❌ --out=PATH incompatible con --json (semánticamente roto: escribir JSON a un path .md).\n   Use --out=PATH para markdown scoreboard, omita --json. Si quiere JSON a archivo, redirige stdout: --json > foo.json`,
    );
    process.exit(2);
  }

  // Run all 3 sub-audits in parallel; isolated error handling per script.
  const startTs = Date.now();
  if (!JSON_MODE) console.error(`📊 Orquestando 3 audit scripts en paralelo...\n`);
  const settled = await Promise.all(SUB_AUDITS.map(runSubAudit));
  const elapsed = Date.now() - startTs;

  const global = aggregate(settled);

  if (JSON_MODE) {
    const json = renderJson(global, settled);
    process.stdout.write(json + "\n");
    if (OUT_PATH) {
      try {
        mkdirSync(dirname(resolve(ROOT, OUT_PATH)), { recursive: true });
        writeFileSync(resolve(ROOT, OUT_PATH), json + "\n", "utf-8");
      } catch (e) {
        console.error(`⚠️ Failed to write --out file: ${e.message}`);
      }
    }
    process.exit(global.exitCode);
  }

  // Markdown path
  const md = renderMarkdown(global, settled);
  process.stdout.write(md);
  if (OUT_PATH) {
    try {
      mkdirSync(dirname(resolve(ROOT, OUT_PATH)), { recursive: true });
      writeFileSync(resolve(ROOT, OUT_PATH), md, "utf-8");
      process.stderr.write(`\n✅ Markdown scoreboard escrito a ${OUT_PATH}\n`);
    } catch (e) {
      process.stderr.write(`\n⚠️ Failed to write --out file: ${e.message}\n`);
    }
  }
  process.stderr.write(
    `\n⏱️  3 sub-audits completados en ${elapsed}ms · exit=${global.exitCode}\n`,
  );
  process.exit(global.exitCode);
}

function printHelp() {
  console.log(`audit-design-system.mjs — Scoreboard unificado del design system.

Combina 3 audit scripts hermanos (tokens + colors + spec) en un dashboard
visual + JSON estable para CI.

Uso:
  node scripts/audit-design-system.mjs                  markdown scoreboard a stdout
  node scripts/audit-design-system.mjs --json           JSON a stdout
  node scripts/audit-design-system.mjs --out=PATH       markdown a archivo (incompatible con --json)
  node scripts/audit-design-system.mjs --strict         propaga --strict a sub-audits
  node scripts/audit-design-system.mjs --spec=DIR       override spec dir (default: specs/design-system-truth)
  node scripts/audit-design-system.mjs --help

Notas sobre --strict:
  Sólo afecta a los sub-audits \`tokens\` (audit-token-coverage.mjs) y \`spec\`
  (audit-spec-coherence.mjs). El audit \`colors\` (audit-hardcoded-colors.mjs)
  no tiene modo strict por diseño.

Score global = spec*0.4 + tokens*0.3 + colors*0.3 (cada uno 0-100).
Exit code = max de los 3 sub-audits (peor gana, Unix convention).

Semaforo:
  ≥80% → 🟢 · 50-79% → 🟡 · <50% → 🔴 · fatal → 🔴 ERROR
`);
}

main().catch((err) => {
  console.error(`❌ Fatal en orquestador: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
