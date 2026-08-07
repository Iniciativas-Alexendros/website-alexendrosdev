#!/usr/bin/env node
/**
 * generate-oklch-tokens.mjs
 *
 * Converts HSL color values from the original design-tokens.css to proper
 * standard OKLCH values (L in [0,1], C in [0,~0.4], H in [0,360)).
 *
 * Source: git show b1591699:src/styles/design-tokens.css (original HSL values)
 * Output: Updated design-tokens.css with correct OKLCH values
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// ─── HSL → OKLCH conversion ────────────────────────────────────────

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab(r, g, b) {
  const R = srgbToLinear(r),
    G = srgbToLinear(g),
    B = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function hslToOklch(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  const { L, a, b: bLab } = rgbToOklab(r, g, b);
  const C = Math.sqrt(a * a + bLab * bLab);
  let hue = Math.atan2(bLab, a) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  return { L, C, H: hue };
}

function formatOklch({ L, C, H }) {
  // Format: "L C H" with appropriate precision
  // L: 4 decimals, C: 4 decimals, H: 1 decimal
  return `${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(1)}`;
}

// ─── Parse HSL values from CSS ──────────────────────────────────────

function parseHslValue(str) {
  // Match: "213 60% 95%" or "213 60% 95% / 0.5"
  const m = str.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%(.*)$/);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]), rest: m[4] || "" };
}

// ─── Main ───────────────────────────────────────────────────────────

// Read the original HSL version from git
const originalCss = execSync("git show b1591699:src/styles/design-tokens.css", {
  encoding: "utf-8",
});

// Parse all HSL variable definitions
const hslDefs = [];
const regex =
  /(--[\w-]+):\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%(\s*\/\s*[\d.]+)?\s*;/g;
let match;
while ((match = regex.exec(originalCss)) !== null) {
  const [full, name, h, s, l, alpha] = match;
  const oklch = hslToOklch(parseFloat(h), parseFloat(s), parseFloat(l));
  hslDefs.push({
    name,
    hsl: `${h} ${s}% ${l}%`,
    oklch: formatOklch(oklch),
    alpha: alpha || "",
    original: full,
  });
}

console.log(`Found ${hslDefs.length} HSL color definitions to convert.\n`);

// Show first 10 as sample
for (const def of hslDefs.slice(0, 10)) {
  console.log(`${def.name}: HSL(${def.hsl}) → OKLCH(${def.oklch})${def.alpha}`);
}
console.log(`... and ${hslDefs.length - 10} more\n`);

// Now apply to current design-tokens.css
let currentCss = readFileSync("src/styles/design-tokens.css", "utf-8");

// Replace each HSL value with OKLCH
let replacements = 0;
for (const def of hslDefs) {
  // Pattern: "--name: H S% L%;" or "--name: H S% L% / alpha;"
  const oldValue = def.alpha ? `${def.hsl}${def.alpha}` : def.hsl;
  const newValue = def.alpha ? `${def.oklch}${def.alpha}` : def.oklch;

  // Use regex to match the variable definition
  const defRegex = new RegExp(
    `(${def.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*)${oldValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(;)`,
    "g",
  );

  const before = currentCss;
  currentCss = currentCss.replace(defRegex, `$1${newValue}$2`);
  if (currentCss !== before) replacements++;
}

console.log(`Replaced ${replacements} values in design-tokens.css`);

// Update the comment to say OKLCH instead of HSL
currentCss = currentCss.replace(
  /Los valores HSL NO llevan comentarios inline/g,
  "Los valores OKLCH NO llevan comentarios inline",
);
currentCss = currentCss.replace(/oklch\(var\(\)\)/g, "oklch(var(--token))");
currentCss = currentCss.replace(
  /COLOR TOKENS\s*\(.*?\)/,
  "COLOR TOKENS  (OKLCH channels — wrap with oklch() at use)",
);

writeFileSync("src/styles/design-tokens.css", currentCss, "utf-8");
console.log("✅ design-tokens.css updated with OKLCH values");

// Output the mapping for reference
writeFileSync("scripts/_hsl-to-oklch-map.json", JSON.stringify(hslDefs, null, 2), "utf-8");
console.log("📝 Mapping saved to scripts/_hsl-to-oklch-map.json");
