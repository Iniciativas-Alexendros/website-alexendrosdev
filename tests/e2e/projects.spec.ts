import { test, expect } from "@playwright/test";

test.describe("/proyectos", () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        msg.type() === "error" &&
        !text.includes("/_vercel/") &&
        !text.includes("Failed to load resource")
      )
        errors.push(`[console.error] ${text}`);
    });
    page.on("response", (res) => {
      const status = res.status();
      if (status >= 400) {
        const url = res.url();
        if (
          url.startsWith("http://localhost:") &&
          !url.includes("/_vercel/") &&
          !url.includes("__nextjs") &&
          !url.endsWith("/favicon.ico")
        )
          errors.push(`[HTTP ${status}] ${url}`);
      }
    });
    await page.goto("/proyectos", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-projects-hydrated='true']")).toBeVisible();
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test("filtra y busca en la página de proyectos", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Proyectos", level: 1 })).toBeVisible();

    await page.getByLabel("Buscar", { exact: true }).fill("imprenta");
    await expect(page.locator(".ak-results-count").last()).toHaveText("1 proyecto");
    await expect(page.getByRole("heading", { name: /Nasve/ })).toBeVisible();

    await page.getByLabel("Buscar", { exact: true }).fill("zzzz-no-existe");
    await expect(page.getByText(/Sin resultados/)).toBeVisible();
  });

  test("filtra proyectos por categoría (select)", async ({ page }) => {
    await page.getByLabel("Categoría").selectOption("Web");
    await expect(page.getByText(/\d+ proyectos/, { exact: true })).toBeVisible();
  });

  test("navega al caso desde una tarjeta sin hacer toda la tarjeta clickable", async ({ page }) => {
    await page
      .getByRole("link", { name: /Ver caso/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/proyectos\/[\w-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("muestra sidebar y grid editorial lado a lado en desktop", async ({ page }) => {
    const layout = page.locator(".ak-projects-page");
    await expect(layout).toBeVisible();

    const layoutStyles = await layout.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { display: s.display, gridTemplateColumns: s.gridTemplateColumns };
    });
    expect(layoutStyles.display).toBe("grid");
    expect(layoutStyles.gridTemplateColumns.split(" ").length).toBe(2);

    const sidebar = page.locator(".ak-projects-sidebar");
    await expect(sidebar).toBeVisible();
    const sidebarStyles = await sidebar.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { position: s.position, top: s.top };
    });
    expect(sidebarStyles.position).toBe("sticky");

    const grid = page.locator(".ak-project-grid");
    await expect(grid).toBeVisible();
    const gridStyles = await grid.evaluate((el) => {
      return { display: window.getComputedStyle(el).display };
    });
    expect(gridStyles.display).toBe("grid");
  });

  test("los tags de stack son visibles y clicables", async ({ page }) => {
    const firstTag = page.locator(".ak-tag-cloud .ak-tag").first();
    await expect(firstTag).toBeVisible();
    await firstTag.click();
    await expect(firstTag).toHaveAttribute("aria-pressed", "true");

    const clearBtn = page.locator(".ak-btn-reset");
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();
    await expect(firstTag).toHaveAttribute("aria-pressed", "false");
  });

  test("el sidebar se oculta por defecto y aparece al pulsar Filtros en móvil", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const sidebar = page.locator(".ak-projects-sidebar");
    const toggle = page.locator(".ak-sidebar-toggle");
    await expect(toggle).toBeVisible();
    await expect(sidebar).not.toHaveClass(/open/);

    await toggle.click();
    await expect(sidebar).toHaveClass(/open/);

    await page.locator(".ak-sidebar-close").click();
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(toggle).toBeFocused();
  });

  test("el drawer de filtros cierra con Escape y conserva el foco", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const toggle = page.locator(".ak-sidebar-toggle");
    await toggle.click();
    await expect(page.locator('.ak-projects-sidebar[role="dialog"]')).toHaveAttribute(
      "aria-modal",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator('.ak-projects-sidebar[role="complementary"]')).not.toHaveClass(
      /open/,
    );
    await expect(toggle).toBeFocused();
  });
});
