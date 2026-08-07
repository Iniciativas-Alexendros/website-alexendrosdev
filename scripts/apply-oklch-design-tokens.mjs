/**
 * Aplica las conversiones HSL → OKLCH a design-tokens.css.
 * - Reemplaza definiciones de variables HSL por OKLCH channels
 * - Cambia hsl(var(--...)) → oklch(var(--...)) en todo el archivo
 */
import { readFileSync, writeFileSync } from "node:fs";

const map = JSON.parse(readFileSync("scripts/_hsl-oklch-map.json", "utf-8"));
const designTokensPath = "src/styles/design-tokens.css";
let content = readFileSync(designTokensPath, "utf-8");

// Build a map of HSL values → OKLCH values
const valueMap = new Map();
for (const entry of map) {
  // The HSL value appears as "H S% L%" in the CSS
  const hslValue = `${entry.h} ${entry.s}% ${entry.l}%`;
  valueMap.set(hslValue, entry.oklch);
}

// Reemplazar definiciones de variables: --name: H S% L%; → --name: OKLCH;
// Solo en :root y .dark (definiciones, no usos)
const lines = content.split("\n");
let inDefinition = false; // track if we're in a variable definition line

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match lines like: "  --name: 213 60% 95%;" or "  --name: 213 60% 95% / 0.05;"
  const defMatch = line.match(
    /^(\s*)(--[\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(\s*\/\s*[\d.]+)?;/,
  );
  if (defMatch) {
    const indent = defMatch[1];
    const varName = defMatch[2];
    const alpha = defMatch[6] || ""; // " / 0.05" or ""

    // Find the OKLCH equivalent
    const hslStr = `${defMatch[3]} ${defMatch[4]}% ${defMatch[5]}%`;
    const oklch = valueMap.get(hslStr);
    if (oklch) {
      lines[i] = `${indent}${varName}: ${oklch}${alpha};`;
    }
  }
}

content = lines.join("\n");

// Cambiar hsl(var(--...)) → oklch(var(--...)) en todo el archivo
content = content.replace(/hsl\(var\(/g, "oklch(var(");

// Update comments that reference HSL
content = content.replace(
  /Light: Arctic Frost · Dark: Ocean Depths/,
  "Light: Arctic Frost · Dark: Ocean Depths (OKLCH channels)",
);
content = content.replace(
  /HSL channels — wrap with hsl\(\) at use/i,
  "OKLCH channels — wrap with oklch() at use",
);

writeFileSync(designTokensPath, content, "utf-8");
console.log("✅ design-tokens.css actualizado: HSL → OKLCH");
