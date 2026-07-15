import { test, expect } from "@playwright/test";

// El Header debe navegar a cada ruta principal y renderizar su <h1>.
const ROUTES: { label: string; path: string }[] = [
  { label: "Proyectos", path: "/proyectos" },
  { label: "Servicios", path: "/servicios" },
  { label: "Blog", path: "/blog" },
  { label: "Stack", path: "/stack" },
  { label: "Contacto", path: "/contacto" },
  { label: "Sobre mí", path: "/sobre-mi" },
];

for (const { label, path } of ROUTES) {
  test(`el header navega a ${path}`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
