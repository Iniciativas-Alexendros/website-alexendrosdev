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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

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

function parseCssTokens(css) {
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);
  function parseBlock(block) {
    const tokens = {};
    const re = /--([\w-]+)\s*:\s*(.+?)\s*;/g;
    let m;
    while ((m = re.exec(block)) !== null) tokens[m[1]] = m[2].trim();
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

function setDeep(obj, path, value) {
  const keys = path.split(".");
  const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);
  let cur = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (blockedKeys.has(key)) return;

    if (
      !Object.prototype.hasOwnProperty.call(cur, key) ||
      !cur[key] ||
      typeof cur[key] !== "object"
    ) {
      cur[key] = {};
    }

    cur = cur[key];
  }

  const lastKey = keys[keys.length - 1];
  if (blockedKeys.has(lastKey)) return;
  cur[lastKey] = value;
}

const CSS_TO_DTCG_MAP = {
  "primary-50": "color.primary.50",
  "primary-100": "color.primary.100",
  "primary-200": "color.primary.200",
  "primary-300": "color.primary.300",
  "primary-400": "color.primary.400",
  "primary-500": "color.primary.500",
  "primary-600": "color.primary.600",
  "primary-700": "color.primary.700",
  "primary-800": "color.primary.800",
  "primary-900": "color.primary.900",
  "primary-950": "color.primary.950",
  "bg-base": "color.surface.background",
  "bg-elevated": "color.surface.elevated",
  "bg-sunken": "color.surface.sunken",
  "bg-highlight": "color.surface.highlight",
  "bg-inset": "color.surface.inset",
  "text-primary": "color.text.primary",
  "text-secondary": "color.text.secondary",
  "text-tertiary": "color.text.tertiary",
  "text-muted": "color.text.muted",
  "text-on-primary": "color.text.on-primary",
  "text-link": "color.text.link",
  "text-link-hover": "color.text.link-hover",
  success: "color.semantic.success",
  warning: "color.semantic.warning",
  emergency: "color.semantic.emergency",
  info: "color.semantic.info",
  border: "color.border.default",
  "border-subtle": "color.border.subtle",
  "border-focus": "color.border.focus",
  "terminal-bg": "color.terminal.bg",
  "terminal-text": "color.terminal.text",
  "terminal-prompt": "color.terminal.prompt",
  "terminal-cursor": "color.terminal.cursor",
  "terminal-comment": "color.terminal.comment",
  "terminal-keyword": "color.terminal.keyword",
  "terminal-string": "color.terminal.string",
};

const DARK_CSS_TO_DTCG_MAP = {};
for (const [cssVar, dtcgPath] of Object.entries(CSS_TO_DTCG_MAP)) {
  DARK_CSS_TO_DTCG_MAP[cssVar] = "dark." + dtcgPath;
}

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

copyFileSync(dtcgPath, dtcgPath.replace(/\.json$/, ".json.bak"));
writeFileSync(dtcgPath, JSON.stringify(dtcg, null, 2) + "\n", "utf-8");

console.log("Updated " + updated + " color tokens in tokens.json");
console.log("Backup saved to tokens.json.bak");
