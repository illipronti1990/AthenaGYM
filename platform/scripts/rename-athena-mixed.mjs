#!/usr/bin/env node
/**
 * Mixed rename: athena* code symbols → movvo*; product strings → Movvo.
 * Preserves Athena Academia, athena-gym/api slugs, migrations, gate scripts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const ROOTS = [
  path.join(root, 'platform/apps'),
  path.join(root, 'platform/packages'),
  path.join(root, 'platform/tests'),
  path.join(root, 'platform/scripts'),
  path.join(root, 'platform/infrastructure'),
  path.join(root, 'Documentacao'),
];

const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  '.next',
  'coverage',
  '.git',
]);

const SKIP_FILE = [
  /grep-athena-gate/,
  /rename-athena-to-movvo/,
  /supabase[/\\]migrations[/\\]/,
];

/** Longest-first symbol renames */
const SYMBOLS = [
  ['MovvoTypographyKey', 'MovvoTypographyKey'],
  ['MovvoIconName', 'MovvoIconName'],
  ['MovvoSpacing', 'MovvoSpacing'],
  ['MovvoTypography', 'MovvoTypography'],
  ['MovvoPlugin', 'MovvoPlugin'],
  ['getMovvoIcon', 'getMovvoIcon'],
  ['movvoShadowsLight', 'movvoShadowsLight'],
  ['movvoTypography', 'movvoTypography'],
  ['movvoSpacing', 'movvoSpacing'],
  ['movvoShadows', 'movvoShadows'],
  ['movvoRadius', 'movvoRadius'],
  ['movvoIcons', 'movvoIcons'],
  ['movvoColors', 'movvoColors'],
  // Custom events
  ["'movvo:save'", "'movvo:save'"],
  ['"movvo:save"', '"movvo:save"'],
  ["'movvo:escape'", "'movvo:escape'"],
  ['"movvo:escape"', '"movvo:escape"'],
  ['movvo:save', 'movvo:save'],
  ['movvo:escape', 'movvo:escape'],
];

/** Product-name replacements (line-level, skip if allowlisted) */
const PRODUCT = [
  [/MOVVO PLATFORM/g, 'MOVVO PLATFORM'],
  [/Movvo Platform/g, 'Movvo Platform'],
  [/MOVVO ERP/g, 'MOVVO ERP'],
  [/Movvo ERP/g, 'Movvo ERP'],
  [/LogoMovvo/g, 'LogoMovvo'],
];

const ALLOW_LINE = [
  /Athena Academia/i,
  /ATHENA_ACADEMIA/,
  /@athena\.local/,
  /@athena\.gym/,
  /athena-gym/,
  /athena-api/,
  /legacy Vercel/i,
  /demo tenant/i,
  /grep-athena-gate/,
  /rename-athena-to-movvo/,
  /branding\/athena/,
  /ALLOWLIST|allowlist|G-20 Grep/,
  /athena\.ts/,
  /20260724_0013_rename_athenas/,
  /ATHENA_E2E_/,
  /localStorage\.(getItem|removeItem)\('athena_/,
  /localStorage\.(getItem|removeItem)\("athena_/,
  /localStorage\.(getItem|removeItem)\('athena\./,
  /localStorage\.(getItem|removeItem)\("athena\./,
  /Não usar/i,
  /legado/i,
  /Packages `@athena/,
  /`@athena\/\*/,
  /not\.toMatch\(\/Movvo ERP/i,
  /not\.toContain\('logoathena/i,
];

const EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.yml',
  '.yaml',
  '.html',
  '.txt',
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

function shouldSkipFile(file) {
  return SKIP_FILE.some((re) => re.test(file.replace(/\\/g, '/')));
}

function transform(content) {
  let next = content;
  for (const [from, to] of SYMBOLS) {
    if (next.includes(from)) next = next.split(from).join(to);
  }

  const lines = next.split('\n');
  const out = lines.map((line) => {
    if (ALLOW_LINE.some((re) => re.test(line))) return line;
    let l = line;
    for (const [re, to] of PRODUCT) {
      l = l.replace(re, to);
    }
    return l;
  });
  return out.join('\n');
}

let filesChanged = 0;
let bytes = 0;
for (const rootDir of ROOTS) {
  if (!fs.existsSync(rootDir)) continue;
  for (const file of walk(rootDir)) {
    if (shouldSkipFile(file)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = transform(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      filesChanged += 1;
      bytes += Math.abs(after.length - before.length);
    }
  }
}

// Root platform md / vercel configs lightly
for (const rel of ['platform/DEPLOY.md', 'platform/README.md', 'cloud/README.md', 'LEIA-ME_ERP.txt', 'INSTRUÇÕES.md']) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file) || shouldSkipFile(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    filesChanged += 1;
  }
}

console.log(`rename-mixed: changed ${filesChanged} files`);
