import { test } from "@playwright/test";

const ROUTES = [
  "/",
  "/servicios",
  "/proyectos",
  "/stack",
  "/sobre-mi",
  "/contacto",
  "/checkout/success",
  "/newsletter/confirmado",
  "/legal/privacidad",
  "/legal/cookies",
  "/legal/condiciones",
  "/legal/aviso-legal",
  "/proximamente",
  "/ruta-que-no-existe",
] as const;

const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 900 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
] as const;

const THEMES = ["light", "dark"] as const;

function routeSlug(route: string) {
  return route === "/" ? "home" : route.replaceAll("/", "_");
}

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`captura ${route} · ${viewport.name}px · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.addInitScript((selectedTheme: string) => {
          localStorage.setItem("ao-theme", selectedTheme);
          if (selectedTheme === "dark") {
            document.documentElement.classList.add("dark");
          }
        }, theme);
        const response = await page.goto(route, { waitUntil: "networkidle" });
        if (!response || response.status() >= 500) {
          throw new Error(`La ruta ${route} no respondió correctamente`);
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() =>
          Array.from(document.images).every((image) => image.complete),
        );
        await page.addStyleTag({
          content:
            "*, *::before, *::after { animation: none !important; transition: none !important; }",
        });
        await page.screenshot({
          path: `artifacts/design-audit/${theme}/${viewport.name}-${routeSlug(route)}.png`,
          fullPage: true,
        });
      });
    }
  }
}
