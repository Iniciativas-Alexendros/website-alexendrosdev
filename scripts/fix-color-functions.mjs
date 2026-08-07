#!/usr/bin/env node
/**
 * fix-color-functions.mjs
 * Ensures all CSS variable usages match the OKLCH token format.
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const TOKEN_FILE = "src/styles/design-tokens.css";
const tokenContent = readFileSync(TOKEN_FILE, "utf-8");

// Detect token format
const sampleMatch = tokenContent.match(/--primary-50:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
let tokenFormat = "hsl";
if (sampleMatch) {
  const [, a, b] = sampleMatch;
  if (parseFloat(a) < 2 && parseFloat(b) < 5) {
    tokenFormat = "oklch";
  }
}

console.log(`Token format: ${tokenFormat.toUpperCase()}`);
const correctFn = tokenFormat === "oklch" ? "oklch" : "hsl";
const wrongFn = tokenFormat === "oklch" ? "hsl" : "oklch";

// Find all source files
const files = execSync(
  'find src tests -type f \\( -name "*.css" -o -name "*.tsx" -o -name "*.ts" \\) | grep -v node_modules',
  { encoding: "utf-8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

let totalFixes = 0;
const fixedFiles = [];

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;

  // Fix hsl(var( → oklch(var( (in CSS/TSX code)
  const wrongPattern = new RegExp(`${wrongFn}\\(var\\(`, "g");
  const matches = content.match(wrongPattern);
  if (matches && matches.length > 0) {
    content = content.replace(wrongPattern, `${correctFn}(var(`);
    totalFixes += matches.length;
    fixedFiles.push(`${file} (${matches.length})`);
  }

  // Fix test assertions: toContain("hsl(") → toContain("oklch(")
  if (file.endsWith(".test.ts")) {
    const wrongTest = new RegExp(`toContain\\("${wrongFn}\\("`, "g");
    const testMatches = content.match(wrongTest);
    if (testMatches) {
      content = content.replace(wrongTest, `toContain("${correctFn}("`);
      totalFixes += testMatches.length;
    }
    // Fix test descriptions
    const wrongDesc = new RegExp(`con ${wrongFn}`, "g");
    if (content.match(wrongDesc)) {
      content = content.replace(wrongDesc, `con ${correctFn}`);
    }
  }

  if (content !== original) {
    writeFileSync(file, content, "utf-8");
  }
}

console.log(`\nFixed ${totalFixes} occurrences in ${fixedFiles.length} files:`);
for (const f of fixedFiles) console.log(`  ${f}`);
