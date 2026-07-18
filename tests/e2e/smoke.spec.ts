import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("la home renderiza y navega a proyectos", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Alejandro Domingo Agustí/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Proyectos", exact: true }).first().click();
  await expect(page).toHaveURL(/\/proyectos$/);
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
});

test("el toggle de tema alterna la clase dark", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const had = (await html.getAttribute("class"))?.includes("dark") ?? false;
  await page.getByRole("button", { name: /Cambiar a modo/ }).click();
  if (had) {
    await expect(html).not.toHaveClass(/dark/);
  } else {
    await expect(html).toHaveClass(/dark/);
  }
});

test("el formulario de contacto se envía", async ({ page }) => {
  await page.goto("/contacto");
  const form = page.locator(".ak-form-card");
  await form.getByPlaceholder("Tu nombre").fill("Ana Pruebas");
  await form.getByPlaceholder("tu@email.com").fill("ana@example.com");
  await form.getByRole("button", { name: /Siguiente/ }).click();
  await form.getByPlaceholder(/Objetivo/).fill("Quiero una plataforma interna.");
  await form.getByRole("button", { name: /Siguiente/ }).click();
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: /Enviar mensaje/ }).click();
  await expect(page.getByText(/Mensaje enviado/)).toBeVisible();
});

test("el catálogo de servicios se renderiza correctamente", async ({ page }) => {
  await page.goto("/servicios");
  await expect(page.getByRole("heading", { name: "Servicios", level: 1 })).toBeVisible();
});

test("la home no tiene violaciones de accesibilidad críticas", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
