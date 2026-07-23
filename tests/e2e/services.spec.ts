import { test, expect } from "@playwright/test";

test.describe("/servicios", () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      // Solo console.error() JS explícito; 404s HTTP los captura response listener
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
        // Filter out expected localhost-only 4xx (Vercel Analytics, Next.js internals)
        if (
          !url.includes("/_vercel/") &&
          !url.includes("__nextjs") &&
          !url.endsWith("/favicon.ico")
        )
          errors.push(`[HTTP ${status}] ${url}`);
      }
    });
    // Forzar reduced motion para que Framer Motion <Reveal> renderice el contenido
    // sin animaciones de entrada y los tests puedan verificar visibilidad.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/servicios");
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test("el grid de pricing muestra 4 columnas en desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const grid = page.getByTestId("tiers-grid");
    await expect(grid).toBeVisible();
    await expect(grid.locator("article")).toHaveCount(4);

    const styles = await grid.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { display: s.display, gridTemplateColumns: s.gridTemplateColumns };
    });
    expect(styles.display).toBe("grid");
    expect(styles.gridTemplateColumns.split(" ").length).toBe(4);
  });

  test("el grid de pricing muestra 2 columnas en tablet", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    const grid = page.getByTestId("tiers-grid");
    await expect(grid).toBeVisible();
    const styles = await grid.evaluate((el) => {
      return { gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns };
    });
    expect(styles.gridTemplateColumns.split(" ").length).toBe(2);
  });

  test("el grid de pricing se apila en una columna en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const grid = page.getByTestId("tiers-grid");
    await expect(grid).toBeVisible();
    const styles = await grid.evaluate((el) => {
      return { gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns };
    });
    expect(styles.gridTemplateColumns.split(" ").length).toBe(1);
  });

  test("el plan Starter está destacado con badge 'Recomendado'", async ({ page }) => {
    const grid = page.getByTestId("tiers-grid");
    const proTier = grid.locator("article").filter({ hasText: "Starter" }).first();
    await expect(proTier).toBeVisible();
    const badge = proTier.getByText("Recomendado");
    await expect(badge).toBeVisible();
  });

  test("el plan Pro/Starter escala ligeramente y tiene borde brand", async ({ page }) => {
    const grid = page.getByTestId("tiers-grid");
    const proTier = grid.locator("article").filter({ hasText: "Starter" }).first();
    await expect(proTier).toBeVisible();
    const styles = await proTier.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { borderColor: s.borderColor, transform: s.transform };
    });
    expect(styles.borderColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(styles.transform).not.toBe("none");
  });

  test("la sección de extras muestra 4 columnas en desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const grid = page.getByTestId("addons-grid");
    await expect(grid).toBeVisible();
    const styles = await grid.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { display: s.display, gridTemplateColumns: s.gridTemplateColumns };
    });
    expect(styles.display).toBe("grid");
    expect(styles.gridTemplateColumns.split(" ").length).toBe(3);
  });

  test("la sección de extras muestra 2 columnas en tablet", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    const grid = page.getByTestId("addons-grid");
    await expect(grid).toBeVisible();
    const styles = await grid.evaluate((el) => {
      return { gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns };
    });
    expect(styles.gridTemplateColumns.split(" ").length).toBe(2);
  });

  test("la sección de extras se apila en una columna en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const grid = page.getByTestId("addons-grid");
    await expect(grid).toBeVisible();
    const styles = await grid.evaluate((el) => {
      return { gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns };
    });
    expect(styles.gridTemplateColumns.split(" ").length).toBe(1);
  });

  test("el acordeón de FAQ abre y cierra", async ({ page }) => {
    const summary = page.getByText(/¿Cómo es tu proceso de trabajo\?/);
    await expect(summary).toBeVisible();
    const details = summary.locator("xpath=ancestor::details").first();

    await expect(details).toHaveAttribute("open", "");
    await summary.click();
    await expect(details).not.toHaveAttribute("open", "");
    await summary.click();
    await expect(details).toHaveAttribute("open", "");
  });

  test("la tabla comparativa tiene scroll horizontal en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const wrap = page.getByTestId("comparison-wrap");
    await expect(wrap).toBeVisible();
    const styles = await wrap.evaluate((el) => {
      return { overflowX: window.getComputedStyle(el).overflowX };
    });
    expect(styles.overflowX).toBe("auto");
  });

  test("el CTA de un plan lleva a contacto", async ({ page }) => {
    await page.getByRole("link", { name: /Empezar este plan/ }).click();
    await expect(page).toHaveURL(/\/contacto$/);
  });
});
