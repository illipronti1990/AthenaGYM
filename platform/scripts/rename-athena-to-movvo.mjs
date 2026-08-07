#!/usr/bin/env node
/**
 * G-20: Rename @athena/* → @movvo/* across platform manifests and source.
 * Usage: node scripts/rename-athena-to-movvo.mjs [--dry-run]
 * Note: already applied once; safe to re-run (no-op if done).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');

const FROM = '@' + 'athena/';
const TO = '@' + 'movvo/';

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  '.git',
  '.turbo',
  'playwright-report',
  'test-results',
  '_compat-athena-shared',
  '_compat-athena-ui',
  '_compat-athena-theme',
]);

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.html',
  '.css',
  '.scss',
  '.txt',
]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function replaceInString(s) {
  return s.replaceAll(FROM, TO).replaceAll('"athena-platform"', '"movvo-platform"');
}

let n = 0;
for (const f of walk(root)) {
  if (f.endsWith('pnpm-lock.yaml')) continue;
  const ext = path.extname(f).toLowerCase();
  if (!TEXT_EXT.has(ext) && path.basename(f) !== 'package.json') continue;
  const raw = fs.readFileSync(f, 'utf8');
  const next = replaceInString(raw);
  if (next === raw) continue;
  if (!dry) fs.writeFileSync(f, next);
  n += 1;
  console.log(path.relative(root, f));
}
console.log(dry ? `[dry-run] ${n}` : `updated ${n}`);
