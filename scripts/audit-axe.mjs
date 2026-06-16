#!/usr/bin/env node
/**
 * audit-axe.mjs — axe-core batch con Playwright
 * Recorre las URLs, ejecuta AxeBuilder y guarda violaciones por impact.
 * Salida: ~/auditoria-alexendros-dev/reports/axe-<slug>.json
 */

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const REPORTS_DIR = join(homedir(), 'auditoria-alexendros-dev', 'reports');
mkdirSync(REPORTS_DIR, { recursive: true });

const CHROME_EXEC = '/home/alexendros/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';

const URLS = [
  'https://alexendros.dev',
  'https://alexendros.dev/servicios',
  'https://alexendros.dev/sobre-mi',
  'https://alexendros.dev/stack',
  'https://alexendros.dev/proyectos',
  'https://alexendros.dev/contacto',
  'https://alexendros.dev/escaparate',
  'https://alexendros.dev/proximamente',
  'https://alexendros.dev/blog',
  'https://alexendros.dev/proyectos/alexendros-me',
  'https://alexendros.dev/proyectos/trenchpass',
  'https://alexendros.dev/proyectos/nasve',
  'https://alexendros.dev/blog/trenchpass-mcp-gateway',
  'https://alexendros.dev/blog/xek-verificacion-componible',
  // Estos son no-HTML — axe no puede analizarlos
  // 'https://alexendros.dev/sitemap.xml',
  // 'https://alexendros.dev/robots.txt',
  // 'https://alexendros.dev/feed.xml',
];

function slugify(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const summary = [];

const browser = await chromium.launch({
  executablePath: CHROME_EXEC,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext();

for (const url of URLS) {
  const slug = slugify(url);
  console.log(`\n[axe] → ${url}`);

  let status = 'ok';
  let violations = [];
  let passes = 0;
  let incomplete = 0;

  const page = await context.newPage();
  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const httpStatus = response?.status() ?? 0;
    if (httpStatus >= 400) {
      status = `http_error_${httpStatus}`;
      console.log(`  HTTP ${httpStatus} — saltando`);
    } else {
      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      violations = axeResults.violations;
      passes = axeResults.passes.length;
      incomplete = axeResults.incomplete.length;

      const byCritical = violations.filter((v) => v.impact === 'critical').length;
      const bySerious = violations.filter((v) => v.impact === 'serious').length;
      const byModerate = violations.filter((v) => v.impact === 'moderate').length;
      const byMinor = violations.filter((v) => v.impact === 'minor').length;

      console.log(
        `  violations: ${violations.length} (critical: ${byCritical}, serious: ${bySerious}, moderate: ${byModerate}, minor: ${byMinor})`
      );
      console.log(`  passes: ${passes}, incomplete: ${incomplete}`);
    }
  } catch (err) {
    status = 'error';
    console.log(`  Error: ${err.message}`);
  } finally {
    await page.close();
  }

  const report = {
    url,
    slug,
    status,
    violations,
    passes,
    incomplete,
  };

  const outPath = join(REPORTS_DIR, `axe-${slug}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`  → ${outPath}`);

  summary.push({
    url,
    slug,
    status,
    critical: violations.filter((v) => v.impact === 'critical').length,
    serious: violations.filter((v) => v.impact === 'serious').length,
    moderate: violations.filter((v) => v.impact === 'moderate').length,
    minor: violations.filter((v) => v.impact === 'minor').length,
    total: violations.length,
  });
}

await context.close();
await browser.close();

// Guardar resumen agregado
const summaryPath = join(REPORTS_DIR, 'axe-summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\n✅ axe completado. Resumen: ${summaryPath}`);
