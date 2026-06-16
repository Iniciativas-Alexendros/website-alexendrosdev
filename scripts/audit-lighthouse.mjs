#!/usr/bin/env node
/**
 * audit-lighthouse.mjs — Core Web Vitals audit con Lighthouse local
 * Rama: auditoria/iter2-2026-06-16
 * 6 corridas: 3 URLs × 2 dispositivos (mobile + desktop)
 */

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

// chrome-launcher es CJS → require con ruta absoluta al store pnpm
const chromeLauncher = require('/home/alexendros/Repositorios/portfolio-alexendros/node_modules/.pnpm/chrome-launcher@1.2.1/node_modules/chrome-launcher/dist/index.js');

// lighthouse es ESM (type: "module") → import dinámico
const { default: lighthouse } = await import('/home/alexendros/Repositorios/portfolio-alexendros/node_modules/lighthouse/core/index.js');

const CHROME_PATH = '/home/alexendros/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const REPORTS_DIR = path.join(homedir(), 'auditoria-alexendros-dev', 'reports');

// Asegurar directorio
mkdirSync(REPORTS_DIR, { recursive: true });

const URLS = [
  { url: 'https://alexendros.dev', slug: 'home' },
  { url: 'https://alexendros.dev/servicios', slug: 'servicios' },
  { url: 'https://alexendros.dev/blog', slug: 'blog', fallback: 'https://alexendros.dev/stack', fallbackSlug: 'stack' },
];

const DEVICES = ['mobile', 'desktop'];

/** Opciones Lighthouse por dispositivo */
function getLighthouseConfig(device) {
  const base = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    maxWaitForFcp: 30000,
    maxWaitForLoad: 45000,
  };

  if (device === 'mobile') {
    return {
      ...base,
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        disabled: false,
      },
      emulatedUserAgent:
        'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    };
  } else {
    return {
      ...base,
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      emulatedUserAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    };
  }
}

/** Extrae métricas clave del resultado de Lighthouse */
function extractMetrics(lhrJson) {
  const lhr = typeof lhrJson === 'string' ? JSON.parse(lhrJson) : lhrJson;
  const cats = lhr.categories || {};
  const audits = lhr.audits || {};

  function getAudit(id) {
    const a = audits[id];
    if (!a) return { numericValue: null, displayValue: null, score: null };
    return {
      numericValue: a.numericValue ?? null,
      displayValue: a.displayValue ?? null,
      score: a.score ?? null,
    };
  }

  function rating(score) {
    if (score === null) return 'n/a';
    if (score >= 0.9) return 'good';
    if (score >= 0.5) return 'needs-improvement';
    return 'poor';
  }

  const lcp = getAudit('largest-contentful-paint');
  const cls = getAudit('cumulative-layout-shift');
  const tbt = getAudit('total-blocking-time');
  const si = getAudit('speed-index');
  const tti = getAudit('interactive');
  const fcp = getAudit('first-contentful-paint');

  return {
    scores: {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats['best-practices']?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
    },
    lcp: {
      ms: lcp.numericValue !== null ? Math.round(lcp.numericValue) : null,
      rating: rating(lcp.score),
    },
    cls: {
      value: cls.numericValue !== null ? cls.numericValue.toFixed(3) : null,
      rating: rating(cls.score),
    },
    tbt: {
      ms: tbt.numericValue !== null ? Math.round(tbt.numericValue) : null,
      rating: rating(tbt.score),
    },
    si: {
      ms: si.numericValue !== null ? Math.round(si.numericValue) : null,
    },
    tti: {
      ms: tti.numericValue !== null ? Math.round(tti.numericValue) : null,
    },
    fcp: {
      ms: fcp.numericValue !== null ? Math.round(fcp.numericValue) : null,
    },
  };
}

/** Corre una corrida de Lighthouse. Retorna { metrics, error } */
async function runAudit(url, slug, device) {
  console.error(`\n▶ Iniciando: ${url} [${device}]`);

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromePath: CHROME_PATH,
      chromeFlags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
      ],
    });

    console.error(`  Chrome PID: ${chrome.pid}, puerto: ${chrome.port}`);

    const config = getLighthouseConfig(device);
    const options = {
      ...config,
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse no devolvió resultado (lhr undefined)');
    }

    // Guardar JSON completo
    const reportPath = path.join(REPORTS_DIR, `lh-${slug}-${device}.json`);
    writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2), 'utf-8');
    console.error(`  ✅ Guardado: ${reportPath}`);

    const metrics = extractMetrics(runnerResult.lhr);
    return { url, slug, device, metrics, error: null };
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    const errorPath = path.join(REPORTS_DIR, `lh-${slug}-${device}.json`);
    writeFileSync(errorPath, JSON.stringify({ error: err.message, url, device, slug }, null, 2), 'utf-8');
    return { url, slug, device, metrics: null, error: err.message };
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
        console.error(`  Chrome cerrado`);
      } catch (_) {}
    }
  }
}

/** Verifica si una URL responde 200 */
async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Genera tabla Markdown */
function buildMarkdownTable(results) {
  const lines = [];
  lines.push('# Resumen Core Web Vitals — alexendros.dev');
  lines.push('');
  lines.push(`> Fecha: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  lines.push(`> Lighthouse 13.4.0 · Chromium headless (playwright)`);
  lines.push('');

  // Tabla de scores
  lines.push('## Scores Lighthouse (0-100)');
  lines.push('');
  lines.push('| URL | Dispositivo | Perf | A11y | Best-P | SEO |');
  lines.push('|-----|-------------|-----:|-----:|-------:|----:|');

  for (const r of results) {
    const label = r.url.replace('https://alexendros.dev', '') || '/';
    if (r.error) {
      lines.push(`| \`${label}\` | ${r.device} | ❌ error | — | — | — |`);
    } else {
      const s = r.metrics.scores;
      lines.push(`| \`${label}\` | ${r.device} | ${s.performance} | ${s.accessibility} | ${s.bestPractices} | ${s.seo} |`);
    }
  }

  lines.push('');
  lines.push('## Core Web Vitals detallados');
  lines.push('');
  lines.push('| URL | Dispositivo | LCP (ms) | LCP rating | CLS | CLS rating | TBT (ms) | TBT rating | Speed Index | TTI (ms) | FCP (ms) |');
  lines.push('|-----|-------------|----------:|------------|-----:|------------|----------:|------------|------------:|---------:|---------:|');

  for (const r of results) {
    const label = r.url.replace('https://alexendros.dev', '') || '/';
    if (r.error) {
      lines.push(`| \`${label}\` | ${r.device} | ❌ | — | — | — | — | — | — | — | — |`);
    } else {
      const m = r.metrics;
      lines.push(
        `| \`${label}\` | ${r.device}` +
          ` | ${m.lcp.ms ?? 'n/a'} | ${m.lcp.rating}` +
          ` | ${m.cls.value ?? 'n/a'} | ${m.cls.rating}` +
          ` | ${m.tbt.ms ?? 'n/a'} | ${m.tbt.rating}` +
          ` | ${m.si.ms ?? 'n/a'}` +
          ` | ${m.tti.ms ?? 'n/a'}` +
          ` | ${m.fcp.ms ?? 'n/a'} |`
      );
    }
  }

  lines.push('');
  lines.push('## Errores');
  lines.push('');
  const errors = results.filter((r) => r.error);
  if (errors.length === 0) {
    lines.push('Ninguna corrida falló.');
  } else {
    for (const e of errors) {
      lines.push(`- **${e.url} [${e.device}]**: \`${e.error}\``);
    }
  }

  lines.push('');
  lines.push(`_Total corridas: ${results.length} · Completadas: ${results.filter((r) => !r.error).length} · Fallidas: ${errors.length}_`);

  return lines.join('\n');
}

/** Main */
async function main() {
  console.error('=== audit-lighthouse.mjs — alexendros.dev ===');
  console.error(`Directorio de reports: ${REPORTS_DIR}`);

  // Resolver URLs (comprobar /blog vs /stack)
  const resolvedUrls = [];
  for (const entry of URLS) {
    if (entry.fallback) {
      const ok = await checkUrl(entry.url);
      if (ok) {
        resolvedUrls.push({ url: entry.url, slug: entry.slug });
        console.error(`✅ ${entry.url} → 200, usando /blog`);
      } else {
        resolvedUrls.push({ url: entry.fallback, slug: entry.fallbackSlug });
        console.error(`⚠️  ${entry.url} → no 200, usando fallback ${entry.fallback}`);
      }
    } else {
      resolvedUrls.push({ url: entry.url, slug: entry.slug });
    }
  }

  const results = [];

  for (const { url, slug } of resolvedUrls) {
    for (const device of DEVICES) {
      const result = await runAudit(url, slug, device);
      results.push(result);
    }
  }

  // Construir resumen
  const markdown = buildMarkdownTable(results);
  const summaryPath = path.join(REPORTS_DIR, 'lh-cwv-resumen.md');
  writeFileSync(summaryPath, markdown, 'utf-8');

  console.error(`\n✅ Resumen guardado: ${summaryPath}`);

  // Imprimir por stdout
  console.log(markdown);
}

main().catch((err) => {
  console.error('Error fatal en main:', err);
  process.exit(1);
});
