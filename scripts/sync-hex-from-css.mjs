#!/usr/bin/env node
/**
 * sync-hex-from-css.mjs — Regenerates hex `$value` in tokens.json
 * from the HSL values in design-tokens.css.
 *
 * Usage:  node scripts/sync-hex-from-css.mjs
 * Effect: Overwrites src/tokens/tokens.json with corrected hex values.
 *         Creates src/tokens/tokens.json.bak as backup.
 */

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CSS_TO_DTCG_MAP, DARK_CSS_TO_DTCG_MAP } from "./token-map.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── HSL → hex (same as validate-tokens.mjs) ────────────────────────────────

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

// ─── Parse CSS ──────────────────────────────────────────────────────────────

function parseCssTokens(css) {
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);

  function parseBlock(block) {
    const tokens = {};
    const re = /--([\w-]+)\s*:\s*(.+?)\s*;/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      tokens[m[1]] = m[2].trim();
    }
    return tokens;
  }

  return {
    light: rootMatch ? parseBlock(rootMatch[1]) : {},
    dark: darkMatch ? parseBlock(darkMatch[1]) : {},
  };
}

function parseHSLValue(str) {
  const m = str.trim().match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  return { h: parseInt(m[1]), s: parseInt(m[2]), l: parseInt(m[3]) };
}

// ─── Deep-update helper ─────────────────────────────────────────────────────

function setDeep(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const css = readFileSync(resolve(ROOT, "src/styles/design-tokens.css"), "utf-8");
const dtcgPath = resolve(ROOT, "src/tokens/tokens.json");
const dtcg = JSON.parse(readFileSync(dtcgPath, "utf-8"));

const { light, dark } = parseCssTokens(css);

let updated = 0;

function sync(cssTokens, mapping) {
  for (const [cssVar, dtcgPath] of Object.entries(mapping)) {
    const cssVal = cssTokens[cssVar];
    if (!cssVal) continue;

    const hsl = parseHSLValue(cssVal);
    if (!hsl) continue;

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    setDeep(dtcg, dtcgPath + ".$value", hex);
    updated++;
  }
}

sync(light, CSS_TO_DTCG_MAP);
sync(dark, DARK_CSS_TO_DTCG_MAP);

// Backup original
copyFileSync(dtcgPath, dtcgPath.replace(/\.json$/, ".json.bak"));

// Write updated
writeFileSync(dtcgPath, JSON.stringify(dtcg, null, 2) + "\n", "utf-8");

console.log(`✅ Updated ${updated} color tokens in tokens.json`);
console.log(`📦 Backup saved to tokens.json.bak`);
