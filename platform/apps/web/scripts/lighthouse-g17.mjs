#!/usr/bin/env node
/**
 * G-17 Lighthouse budgets: FCP / LCP / INP on app shell + login.
 * Requires Chrome and lighthouse (npx).
 *
 * Env:
 *   PLAYWRIGHT_BASE_URL | LIGHTHOUSE_BASE_URL (default http://localhost:3000)
 */
const { spawnSync } = require('child_process');

const base = (
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.LIGHTHOUSE_BASE_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const urls = [`${base}/`, `${base}/login`, `${base}/app`];

/** Budgets in ms (Core Web Vitals–aligned, G-17). */
const BUDGETS = {
  'first-contentful-paint': 2000,
  'largest-contentful-paint': 2500,
  'interaction-to-next-paint': 200,
  'cumulative-layout-shift': 0.1,
};

let failed = false;

for (const url of urls) {
  console.log(`\n→ Lighthouse G-17 ${url}`);
  const r = spawnSync(
    'npx',
    [
      '--yes',
      'lighthouse',
      url,
      '--only-categories=performance',
      '--chrome-flags=--headless --no-sandbox',
      '--quiet',
      '--output=json',
      '--output-path=stdout',
    ],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, shell: true },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || 'lighthouse failed');
    failed = true;
    continue;
  }
  try {
    const report = JSON.parse(r.stdout);
    const audits = report.audits || {};
    const perf = Math.round((report.categories?.performance?.score || 0) * 100);
    console.log(`  performance score: ${perf}`);

    for (const [id, budget] of Object.entries(BUDGETS)) {
      const audit = audits[id];
      if (!audit) {
        console.warn(`  ⚠ audit missing: ${id}`);
        continue;
      }
      const value = audit.numericValue;
      const unit = id === 'cumulative-layout-shift' ? '' : 'ms';
      const ok = typeof value === 'number' && value <= budget;
      const mark = ok ? '✓' : '✗';
      console.log(
        `  ${mark} ${id}: ${value != null ? Number(value).toFixed(id === 'cumulative-layout-shift' ? 3 : 0) : 'n/a'}${unit} (budget ≤ ${budget}${unit})`,
      );
      if (!ok && process.env.LIGHTHOUSE_STRICT === '1') failed = true;
      else if (!ok) console.warn(`  ⚠ meta G-17: ${id} acima do budget (não bloqueante sem LIGHTHOUSE_STRICT=1)`);
    }
  } catch (e) {
    console.error('parse failed', e.message);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
