/**
 * validate-tokens.mjs — Validates consistency between design-tokens.css and tokens.json (DTCG).
 *
 * Checks:
 * 1. CSS tokens present in DTCG (no orphans)
 * 2. DTCG tokens present in CSS (no stale exports)
 * 3. HSL→hex conversion accuracy (< 1% tolerance)
 * 4. Dark mode coverage completeness
 * 5. WCAG AA contrast for critical text/background pairs
 *
 * Usage:  node scripts/validate-tokens.mjs
 * Exit:   0 = clean, 1 = warnings, 2 = errors
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CSS_TO_DTCG_MAP, DARK_CSS_TO_DTCG_MAP } from "./token-map.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Helpers ────────────────────────────────────────────────────────────────

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2),
    darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Parse CSS tokens ───────────────────────────────────────────────────────

function parseCssTokens(css) {
  // Extract :root and .dark blocks
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);

  function parseBlock(block) {
    const tokens = {};
    // Match --var-name: value; patterns
    const re = /--([\w-]+)\s*:\s*(.+?)\s*;/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      const value = m[2].trim();
      // Skip composed values (contain "hsl(" or "var(" or ",")
      if (value.includes("hsl(") || value.includes("var(") || value.includes(",")) continue;
      tokens[m[1]] = value;
    }
    return tokens;
  }

  const light = rootMatch ? parseBlock(rootMatch[1]) : {};
  const dark = darkMatch ? parseBlock(darkMatch[1]) : {};
  return { light, dark };
}

// ─── Parse HSL tokens ───────────────────────────────────────────────────────

function parseHSLValue(str) {
  const m = str.trim().match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  return { h: parseInt(m[1]), s: parseInt(m[2]), l: parseInt(m[3]) };
}

// ─── Flatten DTCG JSON ───────────────────────────────────────────────────────

function flattenDTCG(obj, prefix = "") {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && "$type" in val) {
      result[prefix + key] = val;
    } else if (val && typeof val === "object") {
      Object.assign(result, flattenDTCG(val, prefix + key + "."));
    }
  }
  return result;
}

// ─── Main validation ─────────────────────────────────────────────────────────

async function main() {
  let errors = 0,
    warnings = 0;

  const css = readFileSync(resolve(ROOT, "src/styles/design-tokens.css"), "utf-8");
  const dtcgRaw = JSON.parse(readFileSync(resolve(ROOT, "src/tokens/tokens.json"), "utf-8"));
  const dtcgFlat = flattenDTCG(dtcgRaw);

  const { light: cssLight, dark: cssDark } = parseCssTokens(css);

  console.log("🔍 Validating design-tokens.css ↔ tokens.json (DTCG)\n");

  // ── Check 1: CSS color tokens present in DTCG ──────────────────────────
  console.log("── Check 1: CSS color tokens in DTCG (light) ──");
  for (const [cssVar, dtcgPath] of Object.entries(CSS_TO_DTCG_MAP)) {
    if (!dtcgPath) continue;
    if (!(cssVar in cssLight)) {
      console.warn(`  ⚠️  CSS var --${cssVar} not found in :root block`);
      warnings++;
      continue;
    }
    const cssVal = cssLight[cssVar];
    // Skip composed values (shadows)
    if (!parseHSLValue(cssVal)) continue;

    if (!(dtcgPath in dtcgFlat)) {
      console.error(`  ❌ CSS --${cssVar} → DTCG path "${dtcgPath}" not found in tokens.json`);
      errors++;
      continue;
    }
    console.log(`  ✅ --${cssVar} → ${dtcgPath}`);
  }

  // ── Check 2: Dark mode tokens in DTCG ──────────────────────────────────
  console.log("\n── Check 2: Dark mode tokens in DTCG ──");
  for (const [cssVar, dtcgPath] of Object.entries(DARK_CSS_TO_DTCG_MAP)) {
    if (!dtcgPath) continue;
    if (!(cssVar in cssDark)) {
      continue; // Not all tokens have dark overrides
    }
    if (!(dtcgPath in dtcgFlat)) {
      // Shadows in dark have different path structure
      if (cssVar.startsWith("shadow-")) continue;
      console.error(`  ❌ Dark CSS --${cssVar} → DTCG path "${dtcgPath}" not found`);
      errors++;
      continue;
    }
    console.log(`  ✅ dark --${cssVar} → ${dtcgPath}`);
  }

  // ── Check 3: HSL→hex conversion accuracy ───────────────────────────────
  console.log("\n── Check 3: HSL→hex conversion accuracy (light) ──");
  const TOLERANCE = 2; // ±2 per channel tolerance
  let hexOk = 0,
    hexFail = 0;

  for (const [cssVar, dtcgPath] of Object.entries(CSS_TO_DTCG_MAP)) {
    if (!dtcgPath || !(cssVar in cssLight)) continue;
    const dtcg = dtcgFlat[dtcgPath];
    if (!dtcg || dtcg.$type !== "color" || !dtcg.$value) continue;

    const cssVal = cssLight[cssVar];
    const hsl = parseHSLValue(cssVal);
    if (!hsl) continue;

    const computed = hslToRgb(hsl.h, hsl.s, hsl.l);
    const expected = hexToRgb(dtcg.$value);
    if (!expected) {
      console.warn(`  ⚠️  Cannot parse hex "${dtcg.$value}" for ${dtcgPath}`);
      warnings++;
      continue;
    }

    const dr = Math.abs(computed.r - expected.r);
    const dg = Math.abs(computed.g - expected.g);
    const db = Math.abs(computed.b - expected.b);

    if (dr <= TOLERANCE && dg <= TOLERANCE && db <= TOLERANCE) {
      hexOk++;
    } else {
      console.warn(
        `  ⚠️  --${cssVar}: HSL(${hsl.h} ${hsl.s}% ${hsl.l}%) → computed #${rgbToHex(computed.r, computed.g, computed.b)} ≠ DTCG ${dtcg.$value} (Δ ${dr},${dg},${db})`,
      );
      hexFail++;
    }
  }
  console.log(`     ${hexOk} exact, ${hexFail} off (tolerance ±${TOLERANCE})`);

  // ── Check 4: Dark mode HSL→hex ─────────────────────────────────────────
  console.log("\n── Check 4: HSL→hex conversion accuracy (dark) ──");
  let darkOk = 0,
    darkFail = 0;

  for (const [cssVar, dtcgPath] of Object.entries(DARK_CSS_TO_DTCG_MAP)) {
    if (!dtcgPath || !(cssVar in cssDark)) continue;
    const dtcg = dtcgFlat[dtcgPath];
    if (!dtcg || dtcg.$type !== "color" || !dtcg.$value) continue;

    const hsl = parseHSLValue(cssDark[cssVar]);
    if (!hsl) continue;

    const computed = hslToRgb(hsl.h, hsl.s, hsl.l);
    const expected = hexToRgb(dtcg.$value);
    if (!expected) {
      warnings++;
      continue;
    }

    const dr = Math.abs(computed.r - expected.r);
    const dg = Math.abs(computed.g - expected.g);
    const db = Math.abs(computed.b - expected.b);

    if (dr <= TOLERANCE && dg <= TOLERANCE && db <= TOLERANCE) {
      darkOk++;
    } else {
      console.warn(
        `  ⚠️  dark --${cssVar}: computed #${rgbToHex(computed.r, computed.g, computed.b)} ≠ DTCG ${dtcg.$value} (Δ ${dr},${dg},${db})`,
      );
      darkFail++;
    }
  }
  console.log(`     ${darkOk} exact, ${darkFail} off (tolerance ±${TOLERANCE})`);

  // ── Check 5: DTCG tokens missing from CSS (stale exports) ──────────────
  console.log("\n── Check 5: DTCG tokens without CSS source ──");
  const cssColorVars = new Set([...Object.keys(CSS_TO_DTCG_MAP).filter((k) => CSS_TO_DTCG_MAP[k])]);

  let staleCount = 0;
  // Check light color tokens
  const expectedDTCG = Object.keys(CSS_TO_DTCG_MAP)
    .filter((k) => CSS_TO_DTCG_MAP[k])
    .map((k) => CSS_TO_DTCG_MAP[k]);
  const foundDTCG = Object.keys(dtcgFlat).filter((k) => {
    const v = dtcgFlat[k];
    return v.$type === "color" && !k.startsWith("dark.");
  });

  for (const path of foundDTCG) {
    if (!expectedDTCG.includes(path) && path !== "cta.default") {
      console.warn(`  ⚠️  DTCG token "${path}" has no CSS --var mapping (maybe intentional?)`);
      staleCount++;
    }
  }
  if (staleCount === 0) console.log("  ✅ No stale DTCG tokens");

  // ── Check 6: WCAG AA contrast ──────────────────────────────────────────
  console.log("\n── Check 6: WCAG AA contrast (critical pairs) ──");
  const contrastPairs = [
    { fg: "text-primary", bg: "bg-base", label: "text-primary on bg-base" },
    { fg: "text-secondary", bg: "bg-base", label: "text-secondary on bg-base" },
    { fg: "text-tertiary", bg: "bg-base", label: "text-tertiary on bg-base" },
    { fg: "text-muted", bg: "bg-inset", label: "text-muted on bg-inset" },
    { fg: "text-link", bg: "bg-highlight", label: "text-link on bg-highlight" },
  ];

  const darkContrastPairs = [
    { fg: "text-primary", bg: "bg-base", label: "dark text-primary on bg-base" },
    { fg: "text-secondary", bg: "bg-base", label: "dark text-secondary on bg-base" },
    { fg: "text-tertiary", bg: "bg-base", label: "dark text-tertiary on bg-base" },
    { fg: "text-link", bg: "bg-base", label: "dark text-link on bg-base" },
  ];

  let contrastPass = 0,
    contrastFail = 0;

  function checkContrast(fgVar, bgVar, label, tokens) {
    const fg = tokens[fgVar];
    const bg = tokens[bgVar];
    if (!fg || !bg) return;
    const fgH = parseHSLValue(fg);
    const bgH = parseHSLValue(bg);
    if (!fgH || !bgH) return;
    const fgRGB = hslToRgb(fgH.h, fgH.s, fgH.l);
    const bgRGB = hslToRgb(bgH.h, bgH.s, bgH.l);
    const ratio = contrastRatio(
      luminance(fgRGB.r, fgRGB.g, fgRGB.b),
      luminance(bgRGB.r, bgRGB.g, bgRGB.b),
    );
    if (ratio >= 4.5) {
      console.log(`  ✅ ${label}: ${ratio.toFixed(2)}:1`);
      contrastPass++;
    } else {
      console.error(`  ❌ ${label}: ${ratio.toFixed(2)}:1 — BELOW WCAG AA (4.5)`);
      contrastFail++;
    }
  }

  for (const p of contrastPairs) checkContrast(p.fg, p.bg, p.label, cssLight);
  for (const p of darkContrastPairs) checkContrast(p.fg, p.bg, p.label, cssDark);

  if (contrastFail > 0) errors += contrastFail;
  console.log(`     ${contrastPass} pass, ${contrastFail} fail`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  if (errors === 0 && hexFail === 0 && darkFail === 0 && warnings === 0) {
    console.log("✅ All checks passed — tokens are in sync!");
    console.log(`   ${hexOk + darkOk} HSL→hex conversions verified`);
    console.log(`   ${contrastPass} WCAG AA pairs pass`);
    process.exit(0);
  } else {
    if (hexFail > 0 || darkFail > 0) {
      console.warn(`⚠️  ${hexFail + darkFail} HSL→hex mismatches (tolerance ±${TOLERANCE})`);
    }
    if (errors > 0) {
      console.error(`❌ ${errors} errors found`);
    }
    if (warnings > 0) {
      console.warn(`⚠️  ${warnings} warnings`);
    }
    process.exit(errors > 0 ? 2 : 1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(2);
});
