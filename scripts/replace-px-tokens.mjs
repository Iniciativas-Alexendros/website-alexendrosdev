#!/usr/bin/env node
/**
 * replace-px-tokens.mjs — Reemplaza literales px en spacing por tokens CSS.
 * Solo procesa propiedades margin/padding/gap. Saltea clamp()/calc().
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const WHITELIST_PX = new Set([0, 1, 2, 3, -1, -2, -3, 9999, -9999]);

function pxToSpaceToken(px) {
  const v = Math.abs(px);
  if (WHITELIST_PX.has(px)) return null;
  const rem = v / 4;
  const step = Math.max(1, Math.min(24, Math.round(rem)));
  return `var(--space-${step})`;
}

const files = [
  "src/styles/site.css",
  "src/styles/_projects.css",
  "src/styles/_contact.css",
  "src/styles/_navbar.css",
];

const SPACE_PROPS = [
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-inline",
  "margin-inline-start",
  "margin-inline-end",
  "margin-block",
  "margin-block-start",
  "margin-block-end",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-inline",
  "padding-inline-start",
  "padding-inline-end",
  "padding-block",
  "padding-block-start",
  "padding-block-end",
  "gap",
  "column-gap",
  "row-gap",
];

for (const file of files) {
  const filePath = resolve(ROOT, file);
  let content = readFileSync(filePath, "utf-8");
  let lines = content.split("\n");

  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip comment lines
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // Build a single regex that matches any spacing property
    const propPattern = SPACE_PROPS.map((p) => `\\b${p}`).join("|");
    const regex = new RegExp(`(${propPattern})\\s*:\\s*([^;]+?)(?:\\s*!)?;`, "gi");

    lines[i] = line.replace(regex, (fullMatch, propName, valuePart) => {
      // Skip clamp/calc
      if (/clamp\(|calc\(/.test(valuePart)) return fullMatch;

      // Replace px values with tokens
      const newValues = valuePart.replace(/(-?\d+(?:\.\d+)?)px/g, (pxMatch, num) => {
        const px = parseFloat(num);
        if (WHITELIST_PX.has(px)) return pxMatch;
        return pxToSpaceToken(px);
      });

      if (newValues !== valuePart) {
        changed++;
        return `${propName}: ${newValues};`;
      }
      return fullMatch;
    });
  }

  if (changed > 0) {
    writeFileSync(filePath, lines.join("\n"));
    console.log(`${file}: ${changed} reemplazos`);
  } else {
    console.log(`${file}: sin cambios`);
  }
}

console.log("\nReemplazo completado.");
