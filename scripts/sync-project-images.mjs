#!/usr/bin/env node
/**
 * sync-project-images.mjs
 *
 * Syncs the `REAL_IMAGES` registry in `src/lib/project-images.ts` with
 * actual captured images on disk (`public/images/projects/<slug>/hero.png`).
 *
 * Usage:
 *   node scripts/sync-project-images.mjs
 *
 * Adds any project that has a captured image but is not yet registered in
 * REAL_IMAGES. Does NOT remove registrations for images that no longer exist.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_IMAGES_PATH = join(__dirname, "../src/lib/project-images.ts");
const PUBLIC_IMAGES = join(__dirname, "../public/images/projects");

/**
 * Parses the REAL_IMAGES object from project-images.ts and returns it
 * as a plain object along with the surrounding source pieces for rebuild.
 */
function readRealImages() {
  const src = readFileSync(PROJECT_IMAGES_PATH, "utf-8");
  const lines = src.split("\n");

  // Find the REAL_IMAGES block: from "const REAL_IMAGES:" to the next "};"
  const startIdx = lines.findIndex((l) => /const REAL_IMAGES/.test(l));
  if (startIdx === -1) throw new Error("Could not find REAL_IMAGES declaration");

  // The block ends at the FIRST "};" after the opening "{"
  let braceDepth = 0;
  let endIdx = -1;
  let opened = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") {
        braceDepth++;
        opened = true;
      }
      if (ch === "}") {
        braceDepth--;
      }
      if (opened && braceDepth === 0) {
        endIdx = i;
        break;
      }
    }
    if (endIdx !== -1) break;
  }
  if (endIdx === -1) throw new Error("Could not find end of REAL_IMAGES block");

  const before = lines.slice(0, startIdx).join("\n");
  const blockLines = lines.slice(startIdx, endIdx + 1);
  const after = lines.slice(endIdx + 1).join("\n");

  // Parse existing entries from the block
  // Handles both "quoted-key": and unquoted-key: formats
  const existing = {};
  for (const line of blockLines) {
    const match = line.match(/^\s*"?([\w-]+)"?\s*:\s*"([^"]+)",?\s*$/);
    if (match) {
      existing[match[1]] = match[2];
    }
  }

  return { before, existing, after, blockLines, startIdx, endIdx };
}

/**
 * Scans public/images/projects/ for directories containing hero.png
 * and returns a map of slug → path.
 */
function scanCapturedImages() {
  const images = {};
  if (!existsSync(PUBLIC_IMAGES)) return images;

  const dirs = readdirSync(PUBLIC_IMAGES, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const heroPath = join(PUBLIC_IMAGES, dir.name, "hero.png");
    if (existsSync(heroPath)) {
      images[dir.name] = "/images/projects/" + dir.name + "/hero.png";
    }
  }
  return images;
}

function main() {
  console.log("Syncing REAL_IMAGES with captured images on disk...\n");

  const captured = scanCapturedImages();
  const slugs = Object.keys(captured);
  if (slugs.length === 0) {
    console.log("No captured images found in public/images/projects/");
    return;
  }

  console.log("Captured images found:", slugs.join(", "));

  const { before, existing, after } = readRealImages();
  const newEntries = {};

  for (const slug of slugs) {
    if (!existing[slug]) {
      newEntries[slug] = captured[slug];
    }
  }

  const newSlugs = Object.keys(newEntries);
  if (newSlugs.length === 0) {
    console.log("All captured images are already registered in REAL_IMAGES. Nothing to do.");
    return;
  }

  console.log("New entries to add:", newSlugs.join(", "));

  // Build the new REAL_IMAGES block
  const allEntries = { ...existing, ...newEntries };
  const sortedSlugs = Object.keys(allEntries).sort();
  const entryLines = sortedSlugs.map((slug) => `  "${slug}": "${allEntries[slug]}",`);
  const indent = "const REAL_IMAGES: Record<string, string> = {";
  const close = "};";
  const newBlock = [indent, ...entryLines, close].join("\n");

  const newSrc = before + "\n" + newBlock + "\n" + after;
  writeFileSync(PROJECT_IMAGES_PATH, newSrc, "utf-8");

  console.log("\nUpdated REAL_IMAGES in " + PROJECT_IMAGES_PATH);
  console.log("New registrations:");
  for (const [slug, path] of Object.entries(newEntries)) {
    console.log("  " + slug + " → " + path);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
