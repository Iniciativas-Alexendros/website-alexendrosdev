/**
 * Convierte todas las variables de color HSL → OKLCH en design-tokens.css.
 * Lee el archivo, encuentra definiciones `--name: H S% L%;`, convierte a OKLCH,
 * y deja un mapeo que se puede usar para update.
 *
 * También escanea tokens.ts para convertir los tuples y las sombras literales.
 */

import { readFileSync, writeFileSync } from "node:fs";

// ─── Conversión de color ────────────────────────────────────────────

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}

function rgbToLinear(c) {
  return c <= 0.04044 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab(r, g, b) {
  const R = rgbToLinear(r);
  const G = rgbToLinear(g);
  const B = rgbToLinear(b);

  // sRGB → OKLab (matriz de conversión)
  const L = Math.cbrt(0.8189330101 * R + 0.361643283 * G + 0.0361084428 * B);
  const M = Math.cbrt(0.0329845436 * R + 0.929311573 * G + 0.036088903 * B);
  const S = Math.cbrt(0.0482001761 * R + 0.2642751696 * G + 0.6835042836 * B);

  const LabL = 0.21088921 * L + 0.78926852 * M - 0.00022856 * S;
  const LabA = 1.92801852 * L + 1.69823051 * M - 0.00037469 * S;
  const LabB = 0.08003656 * L + 0.42069601 * M - 0.49425583 * S;

  return { LabL, LabA, LabB };
}

function oklabToOklch(L, a, b) {
  const C = Math.sqrt(a * a + b * b);
  let hue = Math.atan2(b, a) * (180 / Math.PI);
  if (hue < 0) hue += 360;
  return { L: L, C: C, hue: hue };
}

function hslToOklch(hueIn, s, l) {
  // hueIn: 0-360, s: 0-100 (percent), l: 0-100 (percent)
  const hNorm = hueIn % 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const [r, g, b] = hslToRgb(hNorm, sNorm, lNorm);
  const { LabL, LabA, LabB } = rgbToOklab(r, g, b);
  const { L, C, hue } = oklabToOklch(LabL, LabA, LabB);

  // Formato: "L C H" con 4 decimales para L y C, 1 decimal para H
  return `${L.toFixed(4)} ${C.toFixed(4)} ${hue.toFixed(1)}`;
}

// ─── Parseo de valores HSL ──────────────────────────────────────────

function parseHslToken(val) {
  // "213 58% 70%" → { h: 213, s: 58, l: 70 }
  const match = val.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return null;
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

// ─── Procesar design-tokens.css ─────────────────────────────────────

const designTokensPath = "src/styles/design-tokens.css";
let content = readFileSync(designTokensPath, "utf-8");

// Reemplazar todas las definiciones --name: H S% L%; con OKLCH
// Solo dentro de :root y .dark (las secciones de color tokens)
const hslVarRegex = /(--[\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g;

const conversions = [];
let match;
while ((match = hslVarRegex.exec(content)) !== null) {
  const fullMatch = match[0];
  const varName = match[1];
  const h = parseFloat(match[2]);
  const s = parseFloat(match[3]);
  const l = parseFloat(match[4]);
  const oklch = hslToOklch(h, s, l);
  conversions.push({ varName, h, s, l, oklch });
}

// Mostrar todas las conversiones
console.log("=== Conversiones HSL → OKLCH ===\n");
for (const c of conversions) {
  console.log(`  ${c.varName}:`);
  console.log(`    HSL:  ${c.h} ${c.s}% ${c.l}%`);
  console.log(`    OKLCH: ${c.oklch}`);
}

// Escribir el mapeo a un archivo que podemos usar
writeFileSync("scripts/_hsl-oklch-map.json", JSON.stringify(conversions, null, 2), "utf-8");
console.log(`\nTotal: ${conversions.length} conversiones.`);
console.log("Mapeo guardado en scripts/_hsl-oklch-map.json");
