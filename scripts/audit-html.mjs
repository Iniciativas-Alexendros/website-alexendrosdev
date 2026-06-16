#!/usr/bin/env node
/**
 * audit-html.mjs — html-validate offline batch
 * Fetch HTML de producción y validar con html-validate API.
 * Salida: ~/auditoria-alexendros-dev/reports/html-validate-<slug>.json
 */

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { HtmlValidate } = require('html-validate');

const REPORTS_DIR = join(homedir(), 'auditoria-alexendros-dev', 'reports');
mkdirSync(REPORTS_DIR, { recursive: true });

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
  'https://alexendros.dev/sitemap.xml',
  'https://alexendros.dev/robots.txt',
  'https://alexendros.dev/feed.xml',
];

function slugify(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off',
    'attr-quotes': 'off',
  },
});

const summary = [];

for (const url of URLS) {
  const slug = slugify(url);
  console.log(`\n[html-validate] → ${url}`);

  let status = 'ok';
  let errorCount = 0;
  let messages = [];
  let rawResult = null;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'html-validate-audit/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      status = `http_error_${res.status}`;
      console.log(`  HTTP ${res.status} — saltando`);
    } else {
      const html = await res.text();
      const contentType = res.headers.get('content-type') || '';

      // Solo validar HTML (no XML/plain)
      if (!contentType.includes('html') && url.match(/\.(xml|txt)$/)) {
        status = 'skipped_non_html';
        console.log(`  Contenido no-HTML (${contentType}) — saltando validación`);
      } else {
        rawResult = await htmlvalidate.validateString(html, url);
        messages = rawResult.results.flatMap((r) => r.messages);
        errorCount = messages.filter((m) => m.severity === 2).length;
        const warnCount = messages.filter((m) => m.severity === 1).length;
        console.log(`  errores: ${errorCount}, warnings: ${warnCount}`);
      }
    }
  } catch (err) {
    status = 'fetch_error';
    console.log(`  Error: ${err.message}`);
  }

  const report = {
    url,
    slug,
    status,
    errorCount,
    messages,
    raw: rawResult,
  };

  const outPath = join(REPORTS_DIR, `html-validate-${slug}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`  → ${outPath}`);

  summary.push({ url, slug, status, errorCount, messages });
}

// Guardar resumen agregado
const summaryPath = join(REPORTS_DIR, 'html-validate-summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\n✅ html-validate completado. Resumen: ${summaryPath}`);
