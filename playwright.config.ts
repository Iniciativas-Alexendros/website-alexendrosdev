import { defineConfig, devices } from "@playwright/test";

// Use a dedicated E2E port. Freebuff/dev shells may inject PORT for another
// preview server; reusing it can make Playwright test the wrong application.
const PORT = process.env.PLAYWRIGHT_PORT || "3100";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && PORT=${PORT} pnpm start`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
