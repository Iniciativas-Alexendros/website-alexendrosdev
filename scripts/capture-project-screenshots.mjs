#!/usr/bin/env node
/**
 * capture-project-screenshots.mjs
 *
 * Captures real screenshots from project live URLs using Playwright.
 * Projects without a `liveUrl` (stripe-catalog, mcp-toolkit) are skipped — they
 * use OKLCH gradient fallbacks in the UI.
 *
 * Usage:
 *   node scripts/capture-project-screenshots.mjs          # capture new projects only
 *   node scripts/capture-project-screenshots.mjs --force  # re-capture all (overwrite)
 *   node scripts/capture-project-screenshots.mjs --slug=pipeline-crm  # single project
 *
 * Prerequisites:
 *   pnpm exec playwright install chromium
 */

import { chromium } from "@playwright/test";
import sharp from "sharp";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMAGES = join(__dirname, "../public/images/projects");

// Mirror of projects with live URLs (source of truth: src/lib/content/projects.ts)
const PROJECT_LIVE_URLS = {
  "alexendros-me": "https://alexendros.me",
  nasve: "https://ecommerce-graficasnasve.vercel.app",
  "pipeline-crm": "https://alexendros.dev/servicios",
};

// Projects that already have real images (don't re-capture unless --force)
const EXISTING_REAL = new Set(["alexendros-me", "nasve"]);

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const SINGLE_FLAG = args.find((a) => a.startsWith("--slug="));
const SINGLE_SLUG = SINGLE_FLAG ? SINGLE_FLAG.split("=")[1] : null;
const URL_FLAG = args.find((a) => a.startsWith("--url="));
const SINGLE_URL = URL_FLAG ? URL_FLAG.split("=")[1] : null;

async function captureProject(browser, slug, url) {
  const outDir = join(PUBLIC_IMAGES, slug);
  mkdirSync(outDir, { recursive: true });
  const outPathPng = join(outDir, "hero.png");
  const outPathWebp = join(outDir, "hero.webp");

  if (!FORCE && existsSync(outPathWebp)) {
    console.log("  \u23ed  " + slug + ": already exists (use --force to re-capture)");
    return true;
  }

  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    locale: "es-ES",
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  try {
    console.log("  \u2192 " + slug + ": navigating to " + url + "...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    // Extra settle time for fonts, animations, lazy images
    await page.waitForTimeout(3000);

    // Suppress intrusive overlays (cookies, banners) before capture
    await page.evaluate(() => {
      const sels = [
        '[class*="cookie"]',
        '[class*="consent"]',
        '[id*="cookie"]',
        '[class*="banner"]',
        '[class*="overlay"]',
        '[role="dialog"]',
      ];
      for (const sel of sels) {
        for (const el of document.querySelectorAll(sel)) {
          el.style.display = "none";
        }
      }
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: outPathPng, fullPage: false });
    // Convert to WebP
    await sharp(outPathPng)
      .resize(1600, undefined, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPathWebp);
    // Remove the temporary PNG
    rmSync(outPathPng);
    console.log("   \u2705 " + slug + ": saved " + outPathWebp);
    return true;
  } catch (err) {
    console.error("   \u274c " + slug + ": " + err.message);
    return false;
  } finally {
    await ctx.close();
  }
}

async function main() {
  console.log("Capture project screenshots from live URLs...\n");

  const entries = Object.entries(PROJECT_LIVE_URLS);
  const candidates =
    SINGLE_SLUG && SINGLE_URL
      ? [[SINGLE_SLUG, SINGLE_URL]] // CI passthrough: URL from diff, not internal map
      : SINGLE_SLUG
        ? entries.filter(([s]) => s === SINGLE_SLUG)
        : FORCE
          ? entries
          : entries.filter(([s]) => !EXISTING_REAL.has(s));

  if (candidates.length === 0) {
    console.log("No new projects to capture. Use --force to re-capture existing ones.");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  let captured = 0;
  let failed = 0;

  for (const [slug, url] of candidates) {
    const ok = await captureProject(browser, slug, url);
    if (ok) captured++;
    else failed++;
  }

  await browser.close();

  console.log("\nDone. " + captured + " captured, " + failed + " failed.");

  if (captured > 0) {
    console.log("\nNext step: register new images in src/lib/project-images.ts");
    console.log("   Add to REAL_IMAGES:\n");
    for (const [slug] of candidates) {
      if (slug === SINGLE_SLUG || !EXISTING_REAL.has(slug)) {
        console.log('   "' + slug + '": "/images/projects/' + slug + '/hero.webp",');
      }
    }
  }

  const noUrl = ["stripe-catalog", "mcp-toolkit"];
  console.log("\nProjects still using OKLCH gradients (no live URL):");
  for (const slug of noUrl) {
    console.log("   " + slug + " \u2192 gradient fallback");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
