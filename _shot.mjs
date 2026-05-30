import { chromium } from "@playwright/test";
const OUT = "/home/alexendros/.claude/jobs/d7e7838c/tmp";
const base = "http://localhost:3000";
const b = await chromium.launch();
async function shot(path, file, { dark = false, full = true, w = 1280, h = 900 } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  if (dark) await p.addInitScript(() => localStorage.setItem("ao-theme", "dark"));
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/${file}`, fullPage: full });
  await ctx.close();
  console.log("shot", file);
}
await shot("/", "home-light.png", { dark: false });
await shot("/", "home-dark.png", { dark: true });
await shot("/stack", "stack.png", { dark: false, full: false, h: 900 });
await shot("/servicios", "servicios.png", { dark: false });
await shot("/proyectos/plataforma-idp", "caso.png", { dark: true });
await b.close();
