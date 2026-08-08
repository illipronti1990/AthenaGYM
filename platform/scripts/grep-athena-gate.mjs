#!/usr/bin/env node
/**
 * G-20 Grep Gate — fail if forbidden Athena *product* identifiers remain in active code.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const platform = path.resolve(__dirname, '..');
const docs = path.resolve(__dirname, '../../Documentacao');

const DENY = [
  { re: /@athena\//, label: '@athena/ package import' },
  { re: /Athena ERP/i, label: 'Athena ERP product name' },
  { re: /Athena Platform/i, label: 'Athena Platform product name' },
  { re: /ATHENA PLATFORM/, label: 'ATHENA PLATFORM' },
  { re: /LogoAthena\b/, label: 'LogoAthena' },
  { re: /AthenaChat\b/, label: 'AthenaChat' },
  { re: /AthenaDataGrid\b/, label: 'AthenaDataGrid' },
  { re: /AthenaLoader\b/, label: 'AthenaLoader' },
  { re: /\bathenaColors\b/, label: 'athenaColors' },
  { re: /\bathenaIcons\b/, label: 'athenaIcons' },
  { re: /\bAthenaIconName\b/, label: 'AthenaIconName' },
  { re: /\bgetAthenaIcon\b/, label: 'getAthenaIcon' },
  { re: /\bathenaSpacing\b/, label: 'athenaSpacing' },
  { re: /\bAthenaPlugin\b/, label: 'AthenaPlugin' },
  { re: /\bathenaOllamaAnswer\b/, label: 'athenaOllamaAnswer' },
  { re: /\bAthenaAiChatResponse\b/, label: 'AthenaAiChatResponse' },
  { re: /['"]athena:save['"]/, label: 'athena:save event' },
  { re: /['"]athena:escape['"]/, label: 'athena:escape event' },
  { re: /"name"\s*:\s*"@athena\//, label: '@athena package name' },
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
  /MOVVO_E2E_/,
  /not\.toMatch\(\/Athena ERP/i,
  /Não usar/i,
  /legado/i,
  /@movvo\//,
  /Packages `@athena/,
  /`@athena\/\*/,
  /localStorage\.(getItem|removeItem)\('athena_theme'\)/,
  /athena_ui_prefs/,
  /athena_sidebar_collapsed/,
  /athena\.rememberEmail/,
  /athena_theme/,
  /rename-athena-mixed/,
  /ATHENA_E2E_/,
  /fallback ATHENA_/,
  /themeRaw === 'athena'/,
  /\^athena-\//,
  /athenagym/i,
  /ATHENA GYM/,
  /Administrador Athena/,
];

function isAllowed(file, line) {
  const norm = file.replace(/\\/g, '/').toLowerCase();
  if (norm.includes('/dist/') || norm.includes('/.next/') || norm.includes('/node_modules/')) {
    return true;
  }
  // Historical SQL migrations keep original headers
  if (norm.includes('/supabase/migrations/')) return true;
  if (norm.includes('rename-athena-mixed') || norm.includes('rename-athena-to-movvo')) {
    return true;
  }
  if (ALLOW_LINE.some((re) => re.test(line))) return true;
  return false;
}

function scan(cwd, globs = []) {
  let out = '';
  const extra = globs.map((g) => `-g "${g}"`).join(' ');
  try {
    out = execSync(
      `rg -n --no-heading -S "Athena|ATHENA|athena" -g "!**/node_modules/**" -g "!**/.next/**" -g "!**/dist/**" -g "!**/pnpm-lock.yaml" -g "!**/.git/**" ${extra} .`,
      { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, shell: true },
    );
  } catch (e) {
    if (e.status === 1) return [];
    if (e.stdout) out = e.stdout;
    else throw e;
  }
  return out.split('\n').filter(Boolean).map((line) => {
    const idx = line.indexOf(':');
    const file = idx >= 0 ? line.slice(0, idx) : '';
    return { file: path.join(cwd, file.replace(/^\.\//, '').replace(/\\/g, path.sep)), line };
  });
}

const rows = [
  ...scan(platform, [
    'apps/**',
    'packages/**',
    'scripts/**',
    'tests/**',
    'infrastructure/**',
    '*.md',
    'vercel*.json',
  ]),
  ...scan(docs),
];

const violations = [];
for (const { file, line } of rows) {
  if (isAllowed(file, line)) continue;
  for (const d of DENY) {
    if (d.re.test(line)) {
      violations.push({ reason: d.label, line });
      break;
    }
  }
}

if (violations.length) {
  console.error(`G-20 Grep Gate FAILED (${violations.length} violations):\n`);
  for (const v of violations.slice(0, 100)) console.error(`[${v.reason}] ${v.line}`);
  process.exit(1);
}
console.log(`G-20 Grep Gate OK — ${rows.length} lines scanned`);
