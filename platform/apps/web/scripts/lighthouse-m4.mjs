#!/usr/bin/env node
/**
 * M-4 Lighthouse smoke for marketing home + login.
 * Requires Chrome and lighthouse (npx).
 */
const { spawnSync } = require('child_process');

const base = process.env.PLAYWRIGHT_BASE_URL || process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';
const urls = [`${base.replace(/\/$/, '')}/`, `${base.replace(/\/$/, '')}/login`];

let failed = false;
for (const url of urls) {
  console.log(`\n→ Lighthouse ${url}`);
  const r = spawnSync(
    'npx',
    [
      '--yes',
      'lighthouse',
      url,
      '--only-categories=performance,accessibility,best-practices,seo',
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
    const cats = report.categories || {};
    for (const [id, cat] of Object.entries(cats)) {
      const score = Math.round((cat.score || 0) * 100);
      console.log(`  ${id}: ${score}`);
      if ((id === 'performance' || id === 'accessibility') && score < 95) {
        console.warn(`  ⚠ meta M-4: ${id} < 95 (melhorar em iterações)`);
      }
    }
  } catch (e) {
    console.error('parse failed', e.message);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
