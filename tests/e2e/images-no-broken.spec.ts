import { test, expect } from "@playwright/test";

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
];

// Discover project slugs dynamically
async function getProjectSlugs(page: import("@playwright/test").Page) {
  await page.goto("/proyectos", { waitUntil: "networkidle" });
  const slugs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h?.startsWith("/proyectos/"))
      .map((h) => h!.replace("/proyectos/", "").split("?")[0].split("#")[0])
      .filter((s) => s.length > 0 && !s.includes("/")),
  );
  return [...new Set(slugs)];
}

test.describe("No broken images", () => {
  for (const route of ROUTES) {
    test(`images on ${route} load correctly`, async ({ page }) => {
      const failedRequests: string[] = [];
      page.removeAllListeners("requestfailed");

      page.on("requestfailed", (req) => {
        const url = req.url();
        if (
          url.match(/\.(png|jpg|jpeg|webp|gif|svg|avif|ico)(\?|$)/i) &&
          !url.includes("favicon")
        ) {
          failedRequests.push(url);
        }
      });

      await page.goto(route, { waitUntil: "networkidle" });
      // Scroll to trigger lazy images
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const images = await page.locator("img").all();
      for (const img of images) {
        const isVisible = await img.isVisible().catch(() => false);
        if (!isVisible) continue;

        const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
        const src = await img.getAttribute("src");

        // Skip decorative/hidden images
        const ariaHidden = await img.getAttribute("aria-hidden");
        if (ariaHidden === "true") continue;

        expect(
          naturalWidth,
          `Image ${src} on ${route} has naturalWidth 0 (broken)`,
        ).toBeGreaterThan(0);
      }

      expect(
        failedRequests,
        `Image requests failed on ${route}: ${failedRequests.join(", ")}`,
      ).toHaveLength(0);
    });
  }

  test("project detail pages have working hero images", async ({ page }) => {
    const slugs = await getProjectSlugs(page);

    for (const slug of slugs) {
      const failedRequests: string[] = [];
      page.removeAllListeners("requestfailed");

      page.on("requestfailed", (req) => {
        const url = req.url();
        if (
          url.match(/\.(png|jpg|jpeg|webp|gif|svg|avif|ico)(\?|$)/i) &&
          !url.includes("favicon")
        ) {
          failedRequests.push(url);
        }
      });

      await page.goto(`/proyectos/${slug}`, { waitUntil: "networkidle" });

      // Check hero image or gradient
      const heroImg = page.locator(".ak-hero-img");
      const heroCount = await heroImg.count();

      if (heroCount > 0) {
        const hero = heroImg.first();
        const tagName = await hero.evaluate((el) => el.tagName.toLowerCase());

        if (tagName === "img") {
          const naturalWidth = await hero.evaluate((el) => (el as HTMLImageElement).naturalWidth);
          expect(
            naturalWidth,
            `Hero image on /proyectos/${slug} has naturalWidth 0`,
          ).toBeGreaterThan(0);
        }
        // else: it's a gradient div, which is fine
      }

      expect(
        failedRequests,
        `Image requests failed on /proyectos/${slug}: ${failedRequests.join(", ")}`,
      ).toHaveLength(0);
    }
  });
});
