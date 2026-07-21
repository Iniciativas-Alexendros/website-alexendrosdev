#!/usr/bin/env node
/**
 * Crawl all site routes and extract image inventory using Playwright.
 * Usage: node scripts/visual-audit/crawl-and-extract.mjs
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = join(import.meta.dirname, "../../artifacts/visual-audit");

// Routes discovered from src/app
const ROUTES = [
  "/",
  "/sobre-mi",
  "/servicios",
  "/proyectos",
  "/contacto",
  "/stack",
  "/legal/aviso-legal",
  "/legal/condiciones",
  "/legal/cookies",
  "/legal/privacidad",
  "/proximamente",
];

// Dynamic project slugs — we'll discover them from /proyectos page
const DYNAMIC_SLUGS = [];

const EXTRACT_IMAGES_SCRIPT = readFileSync(join(import.meta.dirname, "extract-images.js"), "utf-8");

async function main() {
  console.log(`🔍 Visual audit crawl starting — base: ${BASE_URL}`);
  mkdirSync(join(OUT_DIR, "reports/pages"), { recursive: true });
  mkdirSync(join(OUT_DIR, "screenshots"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-ES",
  });

  const allPages = [];
  const allImages = [];
  const bugs = [];

  // Discover dynamic slugs from /proyectos
  console.log("\n📋 Discovering project slugs from /proyectos...");
  const projPage = await context.newPage();
  try {
    await projPage.goto(`${BASE_URL}/proyectos`, { waitUntil: "networkidle", timeout: 30000 });
    const slugs = await projPage.evaluate(() => {
      return [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && h.startsWith("/proyectos/"))
        .map((h) => h.replace("/proyectos/", "").split("?")[0].split("#")[0])
        .filter((s) => s.length > 0 && !s.includes("/"));
    });
    DYNAMIC_SLUGS.push(...new Set(slugs));
    console.log(`   Found ${DYNAMIC_SLUGS.length} project slugs: ${DYNAMIC_SLUGS.join(", ")}`);
  } catch (e) {
    console.warn(`   ⚠️ Could not discover slugs: ${e.message}`);
  } finally {
    await projPage.close();
  }

  const allRoutes = [...ROUTES, ...DYNAMIC_SLUGS.map((s) => `/proyectos/${s}`)];
  console.log(`\n🗺️  Total routes to crawl: ${allRoutes.length}`);

  for (const route of allRoutes) {
    const slug = route.replace(/\//g, "_").replace(/^_/, "") || "home";
    console.log(`\n📄 Crawling ${route}...`);

    const page = await context.newPage();
    const pageErrors = [];
    const failedRequests = [];

    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("requestfailed", (req) => {
      if (req.url().match(/\.(png|jpg|jpeg|webp|gif|svg|avif|ico)(\?|$)/i)) {
        failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
      }
    });

    try {
      // Retry navigation once on timeout
      let navOk = false;
      for (let attempt = 0; attempt < 2 && !navOk; attempt++) {
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 20000 });
          navOk = true;
        } catch (navErr) {
          if (attempt === 0) console.log(`   ⚠️ Retry navigation...`);
          else throw navErr;
        }
      }
      // Wait for images to load
      await page.waitForTimeout(2000);
      // Scroll to trigger lazy images
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      // Scroll back up
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Screenshot
      await page.screenshot({
        path: join(OUT_DIR, "screenshots", `${slug}-1440.png`),
        fullPage: true,
      });

      // Extract images
      const imageData = await page.evaluate(EXTRACT_IMAGES_SCRIPT);

      // Save per-page JSON
      writeFileSync(
        join(OUT_DIR, "reports/pages", `${slug}.json`),
        JSON.stringify(imageData, null, 2),
      );

      allPages.push({
        path: route,
        slug,
        title: imageData.title,
        screenshot: `screenshots/${slug}-1440.png`,
        imageCount: imageData.count,
      });

      for (const img of imageData.images) {
        allImages.push({ ...img, _pageSlug: slug });
      }

      console.log(`   ✅ ${imageData.count} images found`);

      // Console errors
      if (pageErrors.length > 0) {
        for (const err of pageErrors) {
          bugs.push({ type: "page_error", route, message: err });
          console.log(`   🔴 page error: ${err.slice(0, 100)}`);
        }
      }
      if (failedRequests.length > 0) {
        for (const fr of failedRequests) {
          bugs.push({ type: "image_request_failed", route, ...fr });
          console.log(`   🔴 image failed: ${fr.url}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
      bugs.push({ type: "navigation_error", route, message: e.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Write consolidated inventory
  const inventory = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalRoutes: allRoutes.length,
    totalImages: allImages.length,
    pages: allPages,
    images: allImages,
    bugs,
    publicOrphans: [], // filled by build-inventory
  };

  writeFileSync(join(OUT_DIR, "reports", "inventory.json"), JSON.stringify(inventory, null, 2));

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 VISUAL AUDIT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Routes crawled:    ${allPages.length}`);
  console.log(`Total images:      ${allImages.length}`);
  console.log(`Visible images:    ${allImages.filter((i) => i.visible).length}`);
  console.log(`next/image:        ${allImages.filter((i) => i.nextImage).length}`);
  console.log(`Console errors:    ${bugs.filter((b) => b.type === "page_error").length}`);
  console.log(`Image 4xx/5xx:     ${bugs.filter((b) => b.type === "image_request_failed").length}`);
  console.log(`\nInventory: ${join(OUT_DIR, "reports/inventory.json")}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
