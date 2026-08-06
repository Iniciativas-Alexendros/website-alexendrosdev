import { test, expect } from "@playwright/test";

// El Header debe navegar a cada ruta principal y renderizar su <h1>.
const ROUTES: { label: string; path: string }[] = [
  { label: "Sobre mí", path: "/sobre-mi" },
  { label: "Proyectos", path: "/proyectos" },
  { label: "Stack", path: "/stack" },
  { label: "Servicios", path: "/servicios" },
  { label: "Contacto", path: "/contacto" },
];

for (const { label, path } of ROUTES) {
  test(`el header navega a ${path}`, async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("el menú móvil restaura el foco al cerrarse", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const burger = page.getByRole("button", { name: "Abrir menú" });
  await burger.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
});
