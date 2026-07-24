#!/usr/bin/env node
/**
 * audit-spec-coherence.mjs
 *
 * Auto-validador de coherencia entre un spec de 4 artefactos y la realidad.
 * Parsea los 4 .md de specs/<feature>/, cross-referencia RF↔AC↔TU/TE/TS↔en-tests/,
 * y emite un dashboard markdown a stdout. Útil para que cualquier dev/agent
 * verifique la coherencia del spec en 2 segundos sin leer los 4 archivos
 * completos.
 *
 * Uso:
 *   node scripts/audit-spec-coherence.mjs                     # spec por defecto
 *   node scripts/audit-spec-coherence.mjs specs/<otro>        # spec específico
 *   node scripts/audit-spec-coherence.mjs --json              # salida JSON
 *   node scripts/audit-spec-coherence.mjs --strict            # exit 1 si huerfanos
 *
 * Exit codes:
 *   0 — coherencia aceptable (huerfanos menores documentados OK)
 *   1 — huerfanos críticos o falta de artefactos
 *   2 — error de uso o archivos no encontrados
 */

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.cwd();
const ARGS = new Set(process.argv.slice(2));
const JSON_MODE = ARGS.has("--json");
const STRICT = ARGS.has("--strict");
const USER_ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const SPEC_DIR = USER_ARGS[0] || "specs/design-system-truth";
const FILES = ["spec.md", "contract.md", "scenarios.md", "test-plan.md"];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function readSafe(path) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

function listDirSafe(dir, suffix) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter((f) => f.endsWith(suffix));
  } catch {
    return [];
  }
}

function extractIds(text, pattern) {
  const out = new Set();
  const re = new RegExp(pattern.source, "g");
  let m;
  while ((m = re.exec(text)) !== null) {
    out.add(m[0]);
  }
  return [...out].sort();
}

/**
 * Para cada AC declarado en spec.md, parsea la columna "Vinculado a"
 * de la tabla markdown. Devuelve mapa id→{text, refs:[]}.
 */
function parseAcRows(text) {
  const acRows = new Map();
  const lines = text.split("\n");
  for (const line of lines) {
    // Fila tipo "| AC1 | desc | RF1.1, ..."
    const m = /^[\s|]*\|[\s|]*(AC\d+[a-c]?)\b[^|]*\|([^|]+)\|([^|]*)\|/.exec(line);
    if (!m) continue;
    const id = m[1];
    const last = (m[3] || "").trim();
    acRows.set(id, { text: last, refs: extractIds(last, /\b(?:RF|TU|TE|TS|T6)\S*/g) });
  }
  return acRows;
}

/**
 * Para cada RF declarado en spec.md, busca RFs referenciados en su
 * subsección (§RF...) y ACs vinculados. El bloque termina en el próximo
 * `## ` o `### ` heading (no otro `### RF`), evitando que el último RF
 * absorba accidentalmente la tabla de criterios o secciones posteriores.
 * Opción C del thinker devuelto: combinar sec.acs (byBlock, estricto) +
 * acRows refs (byTable, permisivo) y mostrar ambos al dev.
 */
function parseRfSections(text) {
  const sections = new Map();
  const re = /^###\s+RF(\d+)\s*[-—]\s*([^\n]+)/gm;
  const reEnd = /^#{1,3}\s+/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const id = `RF${m[1]}`;
    const title = m[2].trim();
    const start = m.index + m[0].length;
    reEnd.lastIndex = start;
    const next = reEnd.exec(text);
    const end = next ? next.index : text.length;
    const block = text.slice(start, end);
    sections.set(id, {
      title,
      block,
      acs: extractIds(block, /\bAC\d+[a-c]?\b/g),
      rfs: extractIds(block, /\bRF\d+(?:\.\d+)?\b/g),
    });
  }
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────
// Parsear el spec
// ─────────────────────────────────────────────────────────────────────────

function parseSpec() {
  const report = { artifactsPresent: [], artifactsMissing: [], files: {} };
  for (const f of FILES) {
    const p = join(ROOT, SPEC_DIR, f);
    if (existsSync(p)) {
      report.artifactsPresent.push(f);
      report.files[f] = readFileSync(p, "utf-8");
    } else {
      report.artifactsMissing.push(f);
      report.files[f] = "";
    }
  }
  const spec = report.files["spec.md"];
  const contract = report.files["contract.md"];
  const scenarios = report.files["scenarios.md"];
  const testPlan = report.files["test-plan.md"];

  // IDs detectados
  const rfs = extractIds(spec, /\bRF\d+\b/g);
  const allAcRefs = extractIds(spec, /\bAC\d+[a-c]?\b/g);
  // ACs "declarados" (fila en la tabla) tienen cuerpo vinculado
  const acRows = parseAcRows(spec);
  const acsDeclared = [...acRows.keys()].sort();
  const acsMentioned = allAcRefs.filter((a) => !acsDeclared.includes(a));
  const rfSections = parseRfSections(spec);

  const hps = extractIds(scenarios, /\bHP\d+\b/g);
  const ecs = extractIds(scenarios, /\bEC\d+\b/g);

  const tus = extractIds(testPlan, /\bTU-\d+\.\d+[a-z]?\b/g);
  const tes = extractIds(testPlan, /\bTE-\d+\.\d+[a-z]?\b/g);
  const tss = extractIds(testPlan, /\bTS-\d+\.\d+[a-z]?\b/g);
  const t6s = extractIds(testPlan, /\bT6\.\d+\b/g);

  // Cross-ref RF → AC. Opción C del thinker: combinar dos fuentes.
  // byBlock: ACs literalmente en el cuerpo `### RF[N]` (estricto).
  // byTable: ACs cuya fila en la tabla de criterios cita este RF
  //          (permisivo: cubre RFs que sólo se mencionan en la tabla).
  // El dashboard muestra ambos por RF para que el dev distinga intención.
  const rfCoverage = new Map();
  for (const [rf, sec] of rfSections) {
    const byBlock = new Set(sec.acs);
    const byTable = new Set();
    for (const [acId, row] of acRows) {
      const linked = row.refs.find((r) => r === rf || r.startsWith(rf + "."));
      if (linked) byTable.add(acId);
    }
    rfCoverage.set(rf, { byBlock, byTable });
  }

  return {
    ...report,
    counts: {
      rfs: rfs.length,
      acsDeclared: acsDeclared.length,
      acsMentioned: acsMentioned.length,
      hps: hps.length,
      ecs: ecs.length,
      tus: tus.length,
      tes: tes.length,
      tss: tss.length,
      t6s: t6s.length,
    },
    rfs,
    acsDeclared,
    acsMentioned,
    rfSections,
    rfCoverage,
    hps,
    ecs,
    tus,
    tes,
    tss,
    t6s,
    acRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Verificar realidad (filesystem)
// ─────────────────────────────────────────────────────────────────────────

function checkReality(parsed) {
  const testsUnit = listDirSafe(join(ROOT, "tests", "unit"), ".test.ts");
  const testsE2e = listDirSafe(join(ROOT, "tests", "e2e"), ".spec.ts");
  const scriptsAudit = listDirSafe(join(ROOT, "scripts"), ".mjs");

  const allTestFiles = [
    ...testsUnit.map((f) => `tests/unit/${f}`),
    ...testsE2e.map((f) => `tests/e2e/${f}`),
    ...scriptsAudit.map((f) => `scripts/${f}`),
  ];

  // Mapear cada TU/TE/TS/T6 declarado → buscar su target file
  // Buscaremos por nombre simbólico: TU-0.1 → tests/unit/design-system-audit.test.ts
  const testFileByToken = new Map();
  for (const f of testsUnit) testFileByToken.set(f.replace(".test.ts", ""), f);

  // Para tests prometidos en test-plan: buscar nombre del test referenciado
  const promisedFiles = new Set();
  const tuToFile = new Map();
  const tuFileHints = [
    [/TU-0\.1/, "design-system-audit"],
    [/TU-0\.2/, "css-invariants"],
    [/TU-0\.3/, "z-index-tokens"],
    [/TU-0\.4/, "header-height"],
    [/TU-0\.5/, "css-architecture"],
    [/TU-0\.6/, "css-architecture"],
    [/TU-0\.7/, "css-sticky-tops"],
    [/TU-0\.8/, "inventory-coverage"],
    [/TE-3\.1/, "design-system-visual"],
    [/TS-0\.2/, "audit-hardcoded-colors"],
    [/TS-3\.3|TS-3\.2/, "validate-tokens"],
  ];
  /**
   * Cerebro de mapeo TU/TE/TS → archivo real. Si el spec evoluciona, añadir
   * aquí sin tocar el render. Reglas: nombre base sin extensión, ruta en
   * tuToFile siempre sin prefijo (lo añade el render segun kind).
   */
  for (const tu of parsed.tus) {
    const hit = tuFileHints.find(([re]) => re.test(tu));
    if (hit) {
      tuToFile.set(tu, hit[1]);
      promisedFiles.add(`tests/unit/${hit[1]}.test.ts`);
    }
  }
  for (const te of parsed.tes) {
    const hit = tuFileHints.find(([re]) => re.test(te));
    if (hit) {
      tuToFile.set(te, hit[1]);
      promisedFiles.add(`tests/e2e/${hit[1]}.spec.ts`);
    }
  }
  for (const ts of parsed.tss) {
    const hint = tuFileHints.find(([re]) => re.test(ts));
    if (hint) {
      tuToFile.set(ts, hint[1]);
      promisedFiles.add(`scripts/${hint[1]}.mjs`);
    } else {
      promisedFiles.add(`scripts/${ts.toLowerCase()}.mjs`);
    }
  }

  // Huérfanos = prometido en spec pero NO existe en FS
  const orphans = [];
  for (const f of promisedFiles) {
    if (!existsSync(join(ROOT, f))) orphans.push(f);
  }
  // Reales no prometidos (extra coverage — inventario)
  const extras = [];
  for (const f of allTestFiles) {
    if (!promisedFiles.has(f) && /(audit|design-system|coherence|inventory)/.test(f)) {
      extras.push(f);
    }
  }

  return {
    files: {
      unitTests: testsUnit,
      e2eTests: testsE2e,
      auditScripts: scriptsAudit,
    },
    allTestFiles,
    promisedFiles: [...promisedFiles],
    orphans,
    extras,
    tuToFile,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Score global ponderado
// ────────────────────────────────────────────────────────────────────────
// dos ejes: (a) cobertura docs (AC ↔ RF) y (b) match con realidad (FS).
// El producto final es 0.5 * docs + 0.5 * reality (no es la suma porque
// ambas miden cosas distintas y debe haber coherencia global ≥85%).
function computeCoherenceScore(parsed, reality) {
  if (parsed.acsDeclared.length === 0) return 0;

  // Eje A: docs
  // 1 punto por AC vinculado tanto por bloque como por tabla, 0.5 si
  // solo en una de las dos, 0 si en ninguna.
  let docsPoints = 0;
  let docsMax = parsed.acsDeclared.length;
  for (const ac of parsed.acsDeclared) {
    const inBlockAnyRf = [...parsed.rfCoverage.values()].some((cov) => cov.byBlock.has(ac));
    const inTableAnyRf = [...parsed.rfCoverage.values()].some((cov) => cov.byTable.has(ac));
    if (inBlockAnyRf && inTableAnyRf) docsPoints += 1.0;
    else if (inBlockAnyRf || inTableAnyRf) docsPoints += 0.5;
  }
  const docsPercent = Math.round((docsPoints / docsMax) * 100);

  // Eje B: realidad FS — % de tests prometidos que existen realmente
  const realityPercent = reality.promisedFiles.length
    ? Math.round(
        ((reality.promisedFiles.length - reality.orphans.length) / reality.promisedFiles.length) *
          100,
      )
    : 100;

  return Math.round(docsPercent * 0.5 + realityPercent * 0.5);
}

function naturalCompare(a, b) {
  // AC10 vs AC2: queremos AC2 antes que AC10. Natural sort por sub-sections
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Render dashboard
// ─────────────────────────────────────────────────────────────────────────

function renderDashboard(parsed, reality) {
  const lines = [];
  lines.push(`# Spec coherence report — ${basename(SPEC_DIR)}`);
  lines.push("");
  lines.push(
    `> Spec dir: \`${SPEC_DIR}\` · Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`,
  );
  lines.push("");

  // 1. Integridad de artefactos
  lines.push("## 1 · Artefactos presentes");
  if (parsed.artifactsMissing.length === 0) {
    lines.push("");
    lines.push(`✅ Los 4 artefactos existen: ${parsed.artifactsPresent.join(", ")}.`);
  } else {
    lines.push("");
    lines.push(`❌ Faltan ${parsed.artifactsMissing.length} artefacto(s):`);
    for (const f of parsed.artifactsMissing) lines.push(`   - ${f}`);
  }

  // 2. Score global
  lines.push("");
  lines.push("## 2 · Score global");
  lines.push("");
  const metrics = computeCoherenceScore(parsed, reality);
  const rfDeclared = parsed.rfs.length;
  const acDeclared = parsed.acsDeclared.length;
  const realityMatch = reality.promisedFiles.length
    ? Math.round(
        ((reality.promisedFiles.length - reality.orphans.length) / reality.promisedFiles.length) *
          100,
      )
    : 100;
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---|---|`);
  lines.push(`| Score global (0.5×docs + 0.5×reality) | ${metrics}% |`);
  lines.push(`| Cobertura docs (AC ↔ RF en columnas) | ${metrics}% |`);
  lines.push(
    `| Tests prometidos (TU/TE/TS en test-plan) | ${parsed.tus.length + parsed.tes.length + parsed.tss.length} |`,
  );
  lines.push(`| Match con realidad (FS) | ${realityMatch}% |`);
  lines.push(`| Huérfanos (tests prometidos sin archivo) | ${reality.orphans.length} |`);
  lines.push("");

  // 3. Tabla de cobertura RF → AC (Opción C: block + table)
  lines.push("## 3 · Cobertura RF ↔ AC (byBlock vs byTable)");
  lines.push("");
  lines.push("byBlock = ACs literalmente mencionados en el cuerpo `### RF[N]`.");
  lines.push("byTable = ACs cuya fila en la tabla de criterios cita este RF (o RF[N].k).");
  lines.push("");
  lines.push("| RF | Título | byBlock | byTable |");
  lines.push("|---|---|---|---|");
  for (const [rf, sec] of parsed.rfSections) {
    const cov = parsed.rfCoverage.get(rf) || { byBlock: new Set(), byTable: new Set() };
    const fmt = (s) => (s.size === 0 ? "—" : [...s].sort(naturalCompare).join(", "));
    lines.push(
      `| ${rf} | ${sec.title.slice(0, 60).replace(/\|/g, "\\|")} | ${fmt(cov.byBlock)} | ${fmt(cov.byTable)} |`,
    );
  }
  if (parsed.rfSections.size < parsed.rfs.length) {
    const declaredNoSection = parsed.rfs.filter((r) => !parsed.rfSections.has(r));
    for (const rf of declaredNoSection) {
      lines.push(`| ${rf} | (no section block) | — | — |`);
    }
  }
  lines.push("");

  // 4. Tests prometidos vs realidad
  lines.push("## 4 · Tests prometidos ↔ tests reales");
  lines.push("");
  lines.push("| Test ID | Target file | ¿Existe? |");
  lines.push("|---|---|---|");
  const allPromised = [
    ...parsed.tus.map((id) => ({ id, kind: "TU" })),
    ...parsed.tes.map((id) => ({ id, kind: "TE" })),
    ...parsed.tss.map((id) => ({ id, kind: "TS" })),
  ];
  if (allPromised.length === 0) {
    lines.push("| — | (ningún test prometido) | — |");
  } else {
    for (const { id, kind } of allPromised) {
      const hint = reality.tuToFile.get(id);
      const target =
        kind === "TU"
          ? hint
            ? `tests/unit/${hint}.test.ts`
            : "?"
          : kind === "TE"
            ? hint
              ? `tests/e2e/${hint}.spec.ts`
              : "?"
            : kind === "TS"
              ? hint
                ? `scripts/${hint}.mjs`
                : `scripts/${id.toLowerCase()}.mjs`
              : "?";
      const ok = target !== "?" && existsSync(join(ROOT, target));
      lines.push(`| ${id} | ${target} | ${ok ? "✅" : "❌"} |`);
    }
  }
  lines.push("");

  // 5. Huérfanos
  lines.push("## 5 · Huérfanos (acción)");
  lines.push("");
  if (reality.orphans.length === 0) {
    lines.push("✅ Ningún archivo prometido en el spec está pendiente de crear.");
  } else {
    lines.push(`❌ ${reality.orphans.length} archivo(s) prometido(s) sin crear todavía:`);
    for (const f of reality.orphans) lines.push(`   - ${f}`);
  }
  if (reality.extras.length > 0) {
    lines.push("");
    lines.push(`ℹ️  ${reality.extras.length} test/audit extra(s) no referenciados en el spec:`);
    for (const f of reality.extras) lines.push(`   - ${f}`);
  }
  lines.push("");

  // 6. Stats globales
  lines.push("## 6 · Cobertura por categoría");
  lines.push("");
  lines.push("| Categoría | Cantidad |");
  lines.push("|---|---|");
  lines.push(`| RFs | ${parsed.rfs.length} |`);
  lines.push(`| ACs declarados en spec | ${parsed.acsDeclared.length} |`);
  lines.push(`| ACs mencionados (referencia sin fila propia) | ${parsed.acsMentioned.length} |`);
  lines.push(`| Happy paths (HP) | ${parsed.hps.length} |`);
  lines.push(`| Edge cases (EC) | ${parsed.ecs.length} |`);
  lines.push(`| Tests unit prometidas (TU) | ${parsed.tus.length} |`);
  lines.push(`| Tests e2e prometidos (TE) | ${parsed.tes.length} |`);
  lines.push(`| Tests scripts (TS) | ${parsed.tss.length} |`);
  lines.push(`| Gates de cierre (T6) | ${parsed.t6s.length} |`);
  lines.push(`| Tests reales en tests/unit/*.test.ts | ${reality.files.unitTests.length} |`);
  lines.push(`| Tests reales en tests/e2e/*.spec.ts | ${reality.files.e2eTests.length} |`);
  lines.push(`| Audit scripts reales | ${reality.files.auditScripts.length} |`);
  lines.push("");

  return lines.join("\n");
}

function renderJson(parsed, reality) {
  return JSON.stringify(
    {
      spec: SPEC_DIR,
      generated: new Date().toISOString(),
      coherence: {
        score: computeCoherenceScore(parsed, reality),
        rfCount: parsed.rfs.length,
        acDeclared: parsed.acsDeclared.length,
        acMentioned: parsed.acsMentioned.length,
        hpCount: parsed.hps.length,
        ecCount: parsed.ecs.length,
        tuCount: parsed.tus.length,
        teCount: parsed.tes.length,
        tsCount: parsed.tss.length,
        t6Count: parsed.t6s.length,
      },
      reality: {
        unitTests: reality.files.unitTests,
        e2eTests: reality.files.e2eTests,
        auditScripts: reality.files.auditScripts,
        orphans: reality.orphans,
        extras: reality.extras,
      },
      coverageByRf: Object.fromEntries(
        [...parsed.rfCoverage].map(([rf, cov]) => [
          rf,
          {
            byBlock: [...cov.byBlock].sort(naturalCompare),
            byTable: [...cov.byTable].sort(naturalCompare),
          },
        ]),
      ),
      artifacts: {
        present: parsed.artifactsPresent,
        missing: parsed.artifactsMissing,
      },
    },
    null,
    2,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(join(ROOT, SPEC_DIR))) {
    console.error(`❌ Spec dir no encontrado: ${SPEC_DIR}`);
    process.exit(2);
  }
  const parsed = parseSpec();
  const reality = checkReality(parsed);
  const out = JSON_MODE ? renderJson(parsed, reality) : renderDashboard(parsed, reality);
  console.log(out);

  // Exit codes
  if (parsed.artifactsMissing.length > 0) process.exit(1);
  if (STRICT && (reality.orphans.length > 0 || parsed.acsDeclared.length === 0)) process.exit(1);
  // Por defecto exit 0 (informe, no gate)
  process.exit(0);
}
main();
