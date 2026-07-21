#!/usr/bin/env node
/**
 * Pre-classify images using heuristics before AI analysis.
 * Reads inventory.json, applies rules, outputs DECISIONS.md + updates inventory.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(import.meta.dirname, "../../artifacts/visual-audit/reports");
const inventory = JSON.parse(readFileSync(join(OUT_DIR, "inventory.json"), "utf-8"));

// Project slug → live URL mapping (from CMS/content or known deployments)
// Includes seed names from picsum.photos URLs for reverse lookup
const PROJECT_URLS = {
  "alexendros-me": "https://alexendros.me",
  "alexendros-me-hero": "https://alexendros.me",
  "alexendros-portfolio": "https://alexendros.me",
  nasve: "https://nasve.es",
  "nasve-hero": "https://nasve.es",
  "nasve-shop": "https://nasve.es",
  "pipeline-crm": null, // No live URL — internal tool
  "pipeline-crm-hero": null,
  "stripe-catalog": null, // No live URL — internal tool
  "stripe-catalog-hero": null,
  "mcp-toolkit": null, // No live URL — internal tool
  "mcp-toolkit-hero": null,
};

// Heuristic rules
function preclassify(img) {
  const src = (img.src || "").toLowerCase();
  const alt = (img.alt || "").toLowerCase();
  const nearby = (img.nearbyText || "").toLowerCase();
  const page = img.page || "";

  // Rule 0: Tiny images (avatars, icons, logos) → KEEP
  if (img.box.w <= 64 && img.box.h <= 64) {
    return {
      verdict: "KEEP",
      confidence: 0.85,
      reason: "Avatar/icono pequeño — marca intencional, no candidato a reemplazo.",
      action: "keep",
    };
  }

  // Rule 1: picsum.photos / unsplash / pexels → stock, needs real capture or removal
  if (src.includes("picsum.photos") || src.includes("unsplash") || src.includes("pexels")) {
    // Extract project slug from page path OR image src seed name
    const projectSlug =
      page.match(/\/proyectos\/([\w-]+)/)?.[1] || src.match(/seed\/([^/]+)/)?.[1] || null;
    const captureUrl = projectSlug ? PROJECT_URLS[projectSlug] || null : null;
    if (page.includes("/proyectos/") && page !== "/proyectos") {
      // Project hero image — REPLACE with real screenshot
      return {
        verdict: "REPLACE_WITH_REAL_CAPTURE",
        confidence: 0.95,
        reason:
          "Imagen stock de picsum.photos en hero de proyecto. Debería ser captura real del producto.",
        action: "replace",
        captureUrl,
      };
    }
    // Listing cards — REPLACE with real thumbnails
    return {
      verdict: "REPLACE_WITH_REAL_CAPTURE",
      confidence: 0.9,
      reason:
        "Imagen stock de picsum.photos en card de proyecto. Debería ser thumbnail real del producto.",
      action: "replace",
      captureUrl,
    };
  }

  // Rule 2: Empty alt + decorative
  if (!alt && img.tag === "img" && img.box.w < 50) {
    return {
      verdict: "REMOVE",
      confidence: 0.8,
      reason: "Imagen pequeña sin alt — probablemente decorativa.",
      action: "remove",
    };
  }

  // Rule 3: naturalWidth 0 or broken
  if (img.naturalWidth === 0 || img.naturalWidth === null) {
    return {
      verdict: "REMOVE",
      confidence: 0.95,
      reason: "Imagen rota (naturalWidth 0).",
      action: "remove",
    };
  }

  // Rule 4: opacity 0 or invisible
  if (img.opacity === "0" || !img.visible) {
    return {
      verdict: "REMOVE",
      confidence: 0.85,
      reason: "Imagen invisible (opacity 0 o display none).",
      action: "remove",
    };
  }

  // Default: KEEP (will be reviewed by AI)
  return {
    verdict: "KEEP",
    confidence: 0.5,
    reason: "Sin señal heuristic — requiere revisión IA.",
    action: "keep",
  };
}

// Apply preclassification
for (const img of inventory.images) {
  const classification = preclassify(img);
  img.verdict = classification.verdict;
  img.confidence = classification.confidence;
  img.reason = classification.reason;
  img.action = classification.action;
  img.captureUrl = classification.captureUrl || null;
  img.mismatch = classification.verdict !== "KEEP";
}

// Generate DECISIONS.md
let md = `# Visual Audit — Decisions\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Total images: ${inventory.images.length}\n\n`;

// Summary table
md += `## Summary\n\n`;
md += `| Verdict | Count |\n`;
md += `|---------|-------|\n`;
const counts = {};
for (const img of inventory.images) {
  counts[img.verdict] = (counts[img.verdict] || 0) + 1;
}
for (const [v, c] of Object.entries(counts)) {
  md += `| ${v} | ${c} |\n`;
}
md += `\n`;

// Detailed decisions
md += `## Detailed Decisions\n\n`;
md += `| ID | Page | Source | Verdict | Confidence | Capture URL | Reason |\n`;
md += `|----|------|--------|---------|------------|-------------|--------|\n`;
for (const img of inventory.images) {
  const srcShort = img.src.replace("https://picsum.photos", "picsum").slice(0, 50);
  const captureUrl = img.captureUrl || "—";
  md += `| ${img.id} | ${img.page} | ${srcShort} | ${img.verdict} | ${img.confidence} | ${captureUrl} | ${img.reason.slice(0, 60)} |\n`;
}

// Project-specific replacement plans
md += `\n## Replacement Plans\n\n`;
md += `For REPLACE_WITH_REAL_CAPTURE images, the following real URLs should be captured:\n\n`;

const projectSlugs = ["alexendros-me", "nasve", "pipeline-crm", "stripe-catalog", "mcp-toolkit"];
for (const slug of projectSlugs) {
  md += `- **${slug}**: Capture hero screenshot from live project URL\n`;
}

md += `\n## Next Steps\n\n`;
md += `1. Review DECISIONS.md and confirm each REPLACE verdict\n`;
md += `2. For each REPLACE: capture real screenshot from project URL\n`;
md += `3. Normalize images to public/images/projects/{slug}/hero.webp\n`;
md += `4. Update component src/alt references\n`;
md += `5. Remove stock image references\n`;
md += `6. Run e2e tests to verify no broken images\n`;

writeFileSync(join(OUT_DIR, "DECISIONS.md"), md);

// Save updated inventory
writeFileSync(join(OUT_DIR, "inventory.json"), JSON.stringify(inventory, null, 2));

// Print summary
console.log("📊 Pre-classification complete");
console.log(`   KEEP: ${counts["KEEP"] || 0}`);
console.log(`   REPLACE: ${counts["REPLACE_WITH_REAL_CAPTURE"] || 0}`);
console.log(`   REMOVE: ${counts["REMOVE"] || 0}`);
console.log(`\n   DECISIONS.md: ${join(OUT_DIR, "DECISIONS.md")}`);
console.log(`   inventory.json updated`);
