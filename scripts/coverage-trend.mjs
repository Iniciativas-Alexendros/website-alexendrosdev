#!/usr/bin/env node
/**
 * coverage-trend.mjs — Genera series históricas de `coveragePercent` del token
 * system a partir de la historia git de `src/styles/design-tokens.css`.
 *
 * Por cada commit (LIMIT por defecto, oldest → newest):
 *   1. Crea un worktree efímero en `/tmp/cov-trend-wt-<short_sha>`.
 *   2. Corre `scripts/audit-token-coverage.mjs --json` desde dentro del worktree
 *      para que lea el `design-tokens.css` correcto de ese SHA.
 *   3. Captura `coverage.coveragePercent` (e.g. "93%" → 93) aún si el script
 *      sale con exit 1 (normal cuando hay violations reales).
 *   4. Cleanup: `git worktree remove -f` en `finally { ... }` para evitar
 *      huérfanos tras Ctrl+C o errores subitos.
 *
 * Output: `docs/coverage-trend.md` con:
 *   - Header: span temporal, min/max/current, overall sparkline.
 *   - Tabla: SHA | Date | Coverage % | Δ | Sparkline char.
 *   - Footer: regression y enhancement callouts cuando |Δ| ≥ 5pp.
 *
 * Uso:
 *   node scripts/coverage-trend.mjs                   # default 20 commits
 *   node scripts/coverage-trend.mjs --limit=50        # custom sample size
 *   node scripts/coverage-trend.mjs --since=2026-01-01  # since date filter
 *   node scripts/coverage-trend.mjs --threshold=10   # custom regression threshold (pp)
 *   node scripts/coverage-trend.mjs --json           # JSON output (machine-readable)
 *   node scripts/coverage-trend.mjs --help           # this help
 *
 * Exit codes:
 *   0 — trend generado correctamente (incluso si hubo commits n/a)
 *   1 — error fatal (git no accesible, worktree setup falló, etc.)
 *   130 — SIGINT (Ctrl+C); trabajo limpio garantizado vía signal handler
 *   143 — SIGTERM
 *
 * Signal handling: SIGINT/SIGTERM limpian todos los worktrees activos en
 * `/tmp/cov-trend-wt-*` antes de salir, evitando huérfanos tras abort.
 */

import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEMP_BASE = "/tmp/cov-trend-wt";
const OUTPUT_MD = resolve(ROOT, "docs/coverage-trend.md");

// ───────────────────────────────────────────────────────────────────────
// Signal-safe cleanup registry
// ───────────────────────────────────────────────────────────────────────

/**
 * Active worktrees registry. SIGINT/SIGTERM handlers iterate this set and
 * remove any uncommitted worktrees to avoid /tmp/cov-trend-wt-* leaks on
 * user abort (Ctrl+C, terminal kill, container stop).
 */
const ACTIVE_WORKTREES = new Set();

function setupSignalHandlers() {
  const handler = (signal) => {
    const code = signal === "SIGINT" ? 130 : 143;
    process.stderr.write(
      `\n⚠️ Received ${signal}, cleaning up ${ACTIVE_WORKTREES.size} active worktree(s)...\n`,
    );
    for (const wt of ACTIVE_WORKTREES) {
      try {
        execSync(`git worktree remove -f "${wt}" 2>/dev/null`, { cwd: ROOT, stdio: "ignore" });
      } catch {
        /* best-effort */
      }
    }
    try {
      execSync(`git worktree prune`, { cwd: ROOT, stdio: "ignore" });
    } catch {
      /* best-effort */
    }
    process.exit(code);
  };
  process.on("SIGINT", () => handler("SIGINT"));
  process.on("SIGTERM", () => handler("SIGTERM"));
}

const ARGS = process.argv.slice(2);

// ───────────────────────────────────────────────────────────────────────
// Args
// ───────────────────────────────────────────────────────────────────────

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const found = ARGS.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return ARGS.includes(name);
}

const HELP = hasFlag("--help");
const JSON_MODE = hasFlag("--json");
const LIMIT = parseInt(getArg("limit", "20"), 10);
const SINCE = getArg("since", null);
const THRESHOLD = parseInt(getArg("threshold", "5"), 10);
if (Number.isNaN(THRESHOLD) || THRESHOLD < 1) {
  console.error(`❌ --threshold must be a positive integer (got "${getArg("threshold", "")}")`);
  process.exit(1);
}
const REGRESSION_THRESHOLD_PCT = THRESHOLD;

if (HELP) {
  console.log(
    `Usage: node scripts/coverage-trend.mjs [--limit=N] [--since=YYYY-MM-DD] [--threshold=N] [--json]\n\n` +
      `Options:\n` +
      `  --limit=N        Number of commits to analyze (default: 20, oldest → newest)\n` +
      `  --since=YYYY-MM-DD  Filter commits since date\n` +
      `  --threshold=N    Regression/enhancement threshold in percentage points (default: 5)\n` +
      `  --json            Output JSON instead of markdown\n` +
      `  --help            Show this help\n\n` +
      `Output: docs/coverage-trend.md (overwrites existing file).\n` +
      `Exit codes: 0=ok, 1=fatal, 130=SIGINT (Ctrl+C, cleanup activated)`,
  );
  process.exit(0);
}

// ───────────────────────────────────────────────────────────────────────
// Sparkline rendering
// ───────────────────────────────────────────────────────────────────────

// 8 niveles Unicode (lowest → highest). Mapeo directo 0-100% → 0-7.
// Fijo (no min-max dinámico) para que la escala visual no exagere cambios pequeños.
const SPARK_BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

function sparkChar(coverage) {
  if (coverage == null || isNaN(coverage)) return "?"; // n/a marker
  // Map [0, 100] → [0, 7]
  const idx = Math.max(
    0,
    Math.min(SPARK_BLOCKS.length - 1, Math.round((coverage / 100) * (SPARK_BLOCKS.length - 1))),
  );
  return SPARK_BLOCKS[idx];
}

function sparkLine(coverageList) {
  return coverageList.map(sparkChar).join("");
}

// ───────────────────────────────────────────────────────────────────────
// Git commit discovery
// ───────────────────────────────────────────────────────────────────────

function listCommits() {
  const formatExpr = "%H%x1f%aI"; // SHA + ISO timestamp, separador RS (0x1f)
  const sinceArg = SINCE ? `--since=${SINCE}` : "";
  const cmd = `git log --pretty=format:"${formatExpr}" --no-merges ${sinceArg} -- src/styles/design-tokens.css`;
  const raw = execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, date] = line.split("\x1f");
      return { sha, date };
    });
}

// ───────────────────────────────────────────────────────────────────────
// Audit runner (per commit, in worktree)
// ───────────────────────────────────────────────────────────────────────

/**
 * Runs audit-token-coverage.mjs inside a worktree for a given SHA.
 * Returns { coverage, used, unused, violations, error } or { error: '...' }.
 *
 * Note: audit-token-coverage.mjs exits 1 when violations > 0 (normal). We catch
 * the execSync error, read .stdout for the JSON, and parse it. Exit 2 means
 * design-tokens.css is missing in that commit — returns { error: '...' }.
 */
function runAuditInWorktree({ sha }) {
  const wt = join(TEMP_BASE, sha.slice(0, 7));
  ACTIVE_WORKTREES.add(wt); // tracked so SIGINT/SIGTERM can clean leftovers
  // Pre-cleanup: occasionally a prior run left a stale worktree.
  try {
    execSync(`git worktree remove -f "${wt}" 2>/dev/null`, { cwd: ROOT, stdio: "ignore" });
  } catch {
    /* ok */
  }

  try {
    // -q suppress "Preparing worktree" noise. --detach prevents branch checkout.
    execSync(`git worktree add -q --detach "${wt}" ${sha}`, {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch (e) {
    ACTIVE_WORKTREES.delete(wt);
    return { error: `worktree-add-failed: ${e.message.split("\n")[0]}` };
  }

  // Single audit invocation: capture stdout from BOTH success and failure paths.
  // audit-token-coverage.mjs always writes JSON to stdout before exit, regardless
  // of whether there were violations (exit 1) or fatal errors (exit 2).
  let rawOutput = "";
  let exitCode = 0;
  try {
    rawOutput = execSync(`node scripts/audit-token-coverage.mjs --json`, {
      cwd: wt,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024, // generous; output JSON is < 100 KB normally
    });
  } catch (e) {
    exitCode = e.status ?? 1;
    rawOutput = e.stdout ? e.stdout.toString() : "";
  }

  // Status 2 = fatal (typically: design-tokens.css missing in this commit)
  if (exitCode === 2) {
    return { coverage: null, error: "tokens-css-missing" };
  }

  // Parse whatever stdout we got. Empty stdout → conservative n/a.
  let parsed = null;
  if (rawOutput && rawOutput.trim()) {
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return { coverage: null, error: `json-parse-exit${exitCode}` };
    }
  } else {
    return { coverage: null, error: `empty-stdout-exit${exitCode}` };
  }

  return {
    coverage: parseInt(String(parsed.coverage?.coveragePercent || "0").replace("%", ""), 10),
    used: parsed.coverage?.used ?? null,
    unused: parsed.coverage?.unused ?? null,
    violations: parsed.violations?.count ?? null,
    error: null,
  };
}

// ───────────────────────────────────────────────────────────────────────
// Δ detection
// ───────────────────────────────────────────────────────────────────────

function classifyDelta(deltaPct) {
  if (deltaPct == null || deltaPct === 0) return { icon: "  ", label: "flat", severity: "neutral" };
  if (deltaPct >= REGRESSION_THRESHOLD_PCT)
    return { icon: "🚀", label: "enhancement", severity: "good" };
  if (deltaPct <= -REGRESSION_THRESHOLD_PCT)
    return { icon: "🚨", label: "regression", severity: "bad" };
  if (deltaPct > 0) return { icon: "📈", label: "minor gain", severity: "ok" };
  return { icon: "📉", label: "minor drop", severity: "warn" };
}

// ───────────────────────────────────────────────────────────────────────
// Cleanup
// ───────────────────────────────────────────────────────────────────────

function cleanupWorktree(wt) {
  try {
    execSync(`git worktree remove -f "${wt}" 2>/dev/null`, { cwd: ROOT, stdio: "ignore" });
  } catch {
    /* ok */
  }
  ACTIVE_WORKTREES.delete(wt);
}

// ───────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────

function main() {
  setupSignalHandlers();

  // Known residuals documented for future maintainers:
  //   R1) Si TODOS los commits analizados devuelven null coverage (ej. branch sin
  //       src/styles/design-tokens.css todavía), el markdown final tiene Overall
  //       Sparkline ????? + stats con todos los campos `n/a` + Trend Table con
  //       error markers. Esto es aceptable: indica que el branch analizado no
  //       contiene el archivo. Para re-tentar, usa --since o --limit sobre un
  //       branch con historial de tokens.
  //   R2) SIGINT durante `git worktree add` puede dejar un worktree huérfano en
  //       /tmp/cov-trend-wt-* si add mid-flight recibió la señal. El cleanup
  //       handler es best-effort con try/catch; si quedan residuos tras Ctrl+C,
  //       usar `git worktree prune` o `rm -rf /tmp/cov-trend-wt/*` manualmente.

  if (!existsSync(resolve(ROOT, ".git"))) {
    console.error(`❌ no .git directory found at ${ROOT}`);
    process.exit(1);
  }

  const allCommits = listCommits();
  if (allCommits.length === 0) {
    console.error(`❌ no commits affecting src/styles/design-tokens.css found`);
    process.exit(1);
  }

  // Take most-recent LIMIT, then reverse so iteration is OLDEST → NEWEST (trend order).
  const sample = allCommits.slice(0, LIMIT).reverse();
  console.error(
    `▶ Coverage trend: ${sample.length} commits (oldest ${sample[0].sha.slice(0, 7)} → newest ${sample[sample.length - 1].sha.slice(0, 7)})`,
  );

  // Ensure temp base exists and is clean
  try {
    execSync(`mkdir -p "${TEMP_BASE}"`, { stdio: "ignore" });
  } catch {
    /* ok */
  }

  const measurements = [];
  for (let i = 0; i < sample.length; i++) {
    const commit = sample[i];
    process.stderr.write(
      `  [${i + 1}/${sample.length}] ${commit.sha.slice(0, 7)} (${commit.date.slice(0, 10)}): `,
    );
    const wt = join(TEMP_BASE, commit.sha.slice(0, 7));
    try {
      const result = runAuditInWorktree({ sha: commit.sha });
      measurements.push({
        sha: commit.sha,
        date: commit.date,
        coverage: result.coverage,
        used: result.used,
        unused: result.unused,
        violations: result.violations,
        error: result.error,
      });
      if (result.error) {
        process.stderr.write(`ERR (${result.error})\n`);
      } else {
        process.stderr.write(`${result.coverage}%\n`);
      }
    } finally {
      cleanupWorktree(wt);
    }
  }

  // Cleanup any leftover /tmp/cov-trend-wt directories from prior runs.
  try {
    execSync(`git worktree prune`, { cwd: ROOT, stdio: "ignore" });
  } catch {
    /* ok */
  }

  // Compute Δ vs prev
  const enriched = measurements.map((m, i) => {
    const prev = i > 0 ? measurements[i - 1] : null;
    const delta =
      prev && prev.coverage != null && m.coverage != null ? m.coverage - prev.coverage : null;
    return { ...m, delta, classification: classifyDelta(delta) };
  });

  // Aggregate stats
  const validCoverages = enriched.filter((m) => m.coverage != null).map((m) => m.coverage);
  const stats = {
    commits_total: enriched.length,
    commits_valid: validCoverages.length,
    commits_skipped: enriched.length - validCoverages.length,
    current: validCoverages.length ? validCoverages[validCoverages.length - 1] : null,
    min: validCoverages.length ? Math.min(...validCoverages) : null,
    max: validCoverages.length ? Math.max(...validCoverages) : null,
    avg: validCoverages.length
      ? Math.round(validCoverages.reduce((a, b) => a + b, 0) / validCoverages.length)
      : null,
    regressions: enriched.filter((m) => m.classification.severity === "bad").length,
    enhancements: enriched.filter((m) => m.classification.severity === "good").length,
  };

  const sparklineCoverage = enriched.map((m) => m.coverage);

  // ─── JSON mode ───
  if (JSON_MODE) {
    const out = {
      generated: new Date().toISOString(),
      limit: LIMIT,
      since: SINCE,
      threshold: REGRESSION_THRESHOLD_PCT,
      stats,
      sparkline: sparkLine(sparklineCoverage),
      measurements: enriched.map((m) => ({
        sha: m.sha,
        sha_short: m.sha.slice(0, 7),
        date: m.date,
        coverage: m.coverage,
        used: m.used,
        unused: m.unused,
        violations: m.violations,
        delta: m.delta,
        classification: m.classification.label,
        error: m.error,
      })),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    process.exit(0);
  }

  // ─── Markdown output ───
  const lines = [];
  lines.push("# 📈 Token Coverage Trend");
  lines.push("");
  lines.push(
    `> Auto-generated by \`scripts/coverage-trend.mjs\` on ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC. ` +
      `Sample: **${enriched.length} commits** affecting \`src/styles/design-tokens.css\` (oldest-first). ` +
      `Run anytime: \`node scripts/coverage-trend.mjs\` (or \`--json\` for machine-readable).`,
  );
  lines.push("");
  lines.push("## Stats");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(
    `| Commits analyzed / valid / skipped | ${stats.commits_total} / ${stats.commits_valid} / ${stats.commits_skipped} |`,
  );
  if (stats.current != null) {
    const lastCommit = enriched[enriched.length - 1];
    lines.push(
      `| **Current coverage** | **${stats.current}%** (last analyzed: \`${lastCommit.sha.slice(0, 7)}\` @ ${lastCommit.date.slice(0, 10)}) |`,
    );
  } else {
    lines.push(`| **Current coverage** | n/a |`);
  }
  lines.push(`| Min | ${stats.min != null ? stats.min + "%" : "n/a"} |`);
  lines.push(`| Max | ${stats.max != null ? stats.max + "%" : "n/a"} |`);
  lines.push(`| Avg | ${stats.avg != null ? stats.avg + "%" : "n/a"} |`);
  lines.push(`| Regressions (>${REGRESSION_THRESHOLD_PCT}pp drop) | ${stats.regressions} |`);
  lines.push(`| Enhancements (>${REGRESSION_THRESHOLD_PCT}pp rise) | ${stats.enhancements} |`);
  lines.push("");
  lines.push("## Overall Sparkline (oldest → newest)");
  lines.push("");
  lines.push("```");
  lines.push(sparkLine(sparklineCoverage));
  lines.push("```");
  lines.push("");
  if (enriched[0] && enriched[enriched.length - 1]) {
    lines.push(
      `\`${enriched[0].sha.slice(0, 7)}\` (${enriched[0].date.slice(0, 10)}) → \`${enriched[enriched.length - 1].sha.slice(0, 7)}\` (${enriched[enriched.length - 1].date.slice(0, 10)})`,
    );
    lines.push("");
  }

  // Trend table
  lines.push("## Trend Table");
  lines.push("");
  lines.push(`| SHA | Date | Coverage | Δ vs Prev | Char | Notes |`);
  lines.push(`|---|---|---:|---:|:---:|---|`);
  for (const m of enriched) {
    const shortSha = m.sha.slice(0, 7);
    const dateStr = m.date.slice(0, 10);
    const covStr = m.coverage != null ? `${m.coverage}%` : "n/a";
    const deltaStr = m.delta != null ? (m.delta >= 0 ? `+${m.delta}` : `${m.delta}`) : "—";
    const charStr = m.coverage != null ? sparkChar(m.coverage) : "?";
    const notesParts = [];
    if (m.violations != null) notesParts.push(`${m.violations} viol.`);
    if (m.unused != null) notesParts.push(`${m.unused} unused`);
    if (m.error) notesParts.push(`_error: \`${m.error}\`_`);
    if (m.classification.icon && m.classification.severity !== "neutral") {
      notesParts.push(`${m.classification.icon} ${m.classification.label}`);
    }
    lines.push(
      `| \`${shortSha}\` | ${dateStr} | ${covStr} | ${deltaStr} | ${charStr} | ${notesParts.join(" · ") || ""} |`,
    );
  }
  lines.push("");

  // Footer: regression/enhancement callouts
  const regressions = enriched.filter((m) => m.classification.severity === "bad");
  const enhancements = enriched.filter((m) => m.classification.severity === "good");

  lines.push(
    "## 🚨 Regression Callouts (Δ ≤ -" +
      REGRESSION_THRESHOLD_PCT +
      "pp between consecutive commits)",
  );
  lines.push("");
  if (regressions.length === 0) {
    lines.push(
      `✅ **No regressions detected.** Coverage remained stable or improved across the analyzed range.`,
    );
  } else {
    for (const m of regressions) {
      const idx = enriched.indexOf(m);
      const prev = idx > 0 ? enriched[idx - 1] : null;
      if (prev && prev.coverage != null && m.coverage != null) {
        lines.push(
          `- 🚨 \`${prev.sha.slice(0, 7)}\` (${prev.date.slice(0, 10)}) → \`${m.sha.slice(0, 7)}\` (${m.date.slice(0, 10)}): ` +
            `**${prev.coverage}% → ${m.coverage}%** (Δ **${m.delta}pp**). Review commit \`${m.sha.slice(0, 8)}\`.`,
        );
      }
    }
  }
  lines.push("");

  lines.push(
    "## 🚀 Enhancement Callouts (Δ ≥ +" +
      REGRESSION_THRESHOLD_PCT +
      "pp between consecutive commits)",
  );
  lines.push("");
  if (enhancements.length === 0) {
    lines.push(`ℹ️ **No significant enhancements detected** in the analyzed range.`);
  } else {
    for (const m of enhancements) {
      const idx = enriched.indexOf(m);
      const prev = idx > 0 ? enriched[idx - 1] : null;
      if (prev && prev.coverage != null && m.coverage != null) {
        lines.push(
          `- 🚀 \`${prev.sha.slice(0, 7)}\` → \`${m.sha.slice(0, 7)}\` (${m.date.slice(0, 10)}): ` +
            `**${prev.coverage}% → ${m.coverage}%** (Δ **+${m.delta}pp**). Token consolidation win.`,
        );
      }
    }
  }
  lines.push("");

  // Methodology
  lines.push("---");
  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push(
    `1. **Commit discovery**: \`git log --pretty=format:'%H|%aI' --no-merges -- src/styles/design-tokens.css\` (filtered by user \`--since\` if provided).\n` +
      `2. **Worktree per SHA**: \`git worktree add -q --detach /tmp/cov-trend-wt-<short_sha> <sha>\`. Audit script runs \`from inside\` the worktree so paths resolve correctly.\n` +
      `3. **Audit capture**: \`node scripts/audit-token-coverage.mjs --json\` invoked from worktree root. \`coverage.coveragePercent\` parsed (e.g. \`"93%"\` → 93). Exit 1 (violations) tolerated; exit 2 (file missing) marked \`n/a\`.\n` +
      `4. **Cleanup**: try/finally ensures \`git worktree remove -f\` even on Ctrl+C or script error. \`git worktree prune\` runs at end.\n` +
      `5. **Δ detection**: \`Δ = current.coverage - prev.coverage\`. Threshold = **±${REGRESSION_THRESHOLD_PCT}pp** for the regression/enhancement callouts.\n` +
      `6. **Sparkline**: 8-level Unicode block scale (▁▂▃▄▅▆▇█). Fixed [0%, 100%] range — visual variation reflects true percentage swings, not min/max stretching.`,
  );
  lines.push("");

  // Write file + print summary
  writeFileSync(OUTPUT_MD, lines.join("\n") + "\n");
  console.error(`✓ docs/coverage-trend.md written: ${enriched.length} commits analyzed.`);
  console.error(
    `  Stats: current=${stats.current}% min=${stats.min}% max=${stats.max}% avg=${stats.avg}% ` +
      `regressions=${stats.regressions} enhancements=${stats.enhancements}`,
  );
  process.exit(0);
}

main();
