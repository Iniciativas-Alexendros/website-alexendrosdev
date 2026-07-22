#!/usr/bin/env node
/**
 * Capture real screenshots from live project URLs.
 * Usage: node scripts/visual-audit/capture-real.mjs
 */
import { chromium } from "@playwright/test";

import { join } from "node:path";

const OUT_DIR = join(import.meta.dirname, "../../public/images/projects");

const CAPTURES = [
  {
    slug: "alexendros-me",
    url: "https://alexendros.me",
    out: "hero.webp",
    width: 1600,
    height: 900,
    clip: { x: 0, y: 0, width: 1600, height: 900 },
  },
  {
    slug: "nasve",
    url: "https://ecommerce-graficasnasve.vercel.app",
    out: "hero.webp",
    width: 1600,
    height: 900,
    clip: { x: 0, y: 0, width: 1600, height: 900 },
  },
];

async function main() {
  console.log("📸 Capturing real project screenshots...");
  const browser = await chromium.launch({ headless: true });

  for (const cap of CAPTURES) {
    console.log(`\n  → ${cap.slug}: ${cap.url}`);
    const ctx = await browser.newContext({
      viewport: { width: cap.width, height: cap.height },
      locale: "es-ES",
    });
    const page = await ctx.newPage();
    try {
      await page.goto(cap.url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for animations/fonts
      const outPath = join(OUT_DIR, cap.slug, cap.out);
      await page.screenshot({
        path: outPath.replace(".webp", ".png"), // Playwright doesn't output webp directly
        clip: cap.clip,
      });
      console.log(`   ✅ Saved ${outPath.replace(".webp", ".png")}`);
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`);
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  console.log("\n📸 Done. Convert PNGs to WebP with: sharp or cwebp");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
