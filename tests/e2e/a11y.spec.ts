import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Cobertura de accesibilidad en las rutas clave: ninguna debe tener
// violaciones de impacto crítico (axe-core).
const ROUTES = [
  "/",
  "/sobre-mi",
  "/servicios",
  "/proyectos",
  "/blog",
  "/contacto",
  "/escaparate",
  "/stack",
];

for (const route of ROUTES) {
  test(`sin violaciones críticas de accesibilidad en ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
}
