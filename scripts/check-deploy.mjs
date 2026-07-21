// scripts/check-deploy.mjs
// Verifica que alexendros.dev sirve la nueva versión del deploy
import { chromium } from "@playwright/test";

const BASE = "https://alexendros.dev";
const ROUTES = [
  "/",
  "/proyectos",
  "/proyectos/alexendros-me",
  "/proyectos/nasve",
  "/proyectos/pipeline-crm",
  "/proyectos/stripe-catalog",
  "/proyectos/mcp-toolkit",
  "/sobre-mi",
  "/contacto",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  let totalPicsum = 0;
  let totalProjectImages = 0;
  let allOk = true;

  for (const route of ROUTES) {
    const page = await context.newPage();
    try {
      console.log(`\n🔍 ${BASE}${route}`);
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 });

      // Scroll to trigger lazy images
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Check for picsum.photos
      const picsumCount = await page.locator('img[src*="picsum"]').count();
      totalPicsum += picsumCount;

      // Check for our project images
      const projectImageCount = await page.locator('img[src*="/images/projects/"]').count();
      totalProjectImages += projectImageCount;

      // Log all non-trivial images
      const imgs = await page.evaluate(() =>
        [...document.querySelectorAll("img")]
          .filter((el) => {
            const src = el.src || "";
            return src && !src.includes("favicon") && !src.includes("logo");
          })
          .map((el) => ({
            src: (el.src || "").slice(0, 150),
            alt: (el.alt || "").slice(0, 50),
            w: el.naturalWidth,
          })),
      );

      console.log(`   picsum.photos: ${picsumCount}`);
      console.log(`   project images (/images/projects/): ${projectImageCount}`);
      for (const img of imgs) {
        console.log(`   📷 ${img.src} (${img.w}px)`);
      }

      if (picsumCount > 0) {
        console.log(`   ❌ Found ${picsumCount} picsum.photos on ${route}`);
        allOk = false;
      }
    } catch (err) {
      console.error(`   ❌ Error on ${route}: ${err.message}`);
      allOk = false;
    } finally {
      await page.close();
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`📊 Total picsum.photos across all routes: ${totalPicsum}`);
  console.log(`📊 Total project images across all routes: ${totalProjectImages}`);

  if (totalPicsum === 0 && totalProjectImages > 0) {
    console.log("✅ DEPLOY OK — No picsum, new project images present!");
  } else if (totalPicsum === 0 && totalProjectImages === 0) {
    console.log("⚠️ No picsum found but also no project images detected.");
    console.log("   This could mean images are loaded client-side or from other paths.");
  } else if (totalPicsum > 0) {
    console.log("❌ DEPLOY INCOMPLETE — picsum.photos still found.");
  }

  await browser.close();
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
