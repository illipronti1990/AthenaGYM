#!/usr/bin/env node
/** Second pass — remaining product/code athena → movvo (keep demo tenant / allowlist). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const ROOTS = [
  path.join(root, 'platform/apps'),
  path.join(root, 'platform/packages'),
  path.join(root, 'platform/tests'),
  path.join(root, 'Documentacao'),
];

const SKIP_DIR = new Set(['node_modules', 'dist', '.next', 'coverage', '.git']);
const SKIP_FILE = [
  /grep-athena-gate/,
  /rename-athena-to-movvo/,
  /rename-athena-mixed/,
  /supabase[/\\]migrations[/\\]/,
  /branding[/\\]athena\.ts$/,
  /seed-dev-user\.mjs$/,
  /seed-admin-user\.mjs$/,
  /seed-demo-users\.mjs$/,
  /SocialLinks\.tsx$/,
];

const SYMBOLS = [
  ['AthenaAiChatResponse', 'MovvoAiChatResponse'],
  ['AthenaAiPersona', 'MovvoAiPersona'],
  ['athenaOllamaAnswer', 'movvoOllamaAnswer'],
  ['AthenaSkeleton', 'MovvoSkeleton'],
  ['X-Athena-Signature', 'X-Movvo-Signature'],
  ['X-Athena-Event', 'X-Movvo-Event'],
  ['dataset.athenaA11y', 'dataset.movvoA11y'],
  ['athena_access_token', 'movvo_access_token'],
  ['[Athena RUM]', '[Movvo RUM]'],
  ['publisher: \'ATHENA Labs\'', "publisher: 'Movvo Labs'"],
  ['publisher: "ATHENA Labs"', 'publisher: "Movvo Labs"'],
];

const LINE_PRODUCT = [
  [/^# ATHENA /gm, '# MOVVO '],
  [/ATHENA AI service/g, 'MOVVO AI service'],
  [/ATHENA analytics/g, 'MOVVO analytics'],
  [/ATHENA AI assistant/g, 'MOVVO AI assistant'],
  [/ATHENA Trainer/g, 'MOVVO Trainer'],
  [/ATHENA Student/g, 'MOVVO Student'],
  [/ATHENA Manager/g, 'MOVVO Manager'],
  [/\/\* Athena 8-point/g, '/* Movvo 8-point'],
  [/\/\* Athena AI floating/g, '/* Movvo AI floating'],
  [/ATHENA GYM\./g, 'Movvo.'], // ContextualActions product copy only when "ATHENA GYM."
];

const ALLOW_LINE = [
  /Athena Academia/i,
  /ATHENA_ACADEMIA/,
  /@athena\.local/,
  /@athena\.gym/,
  /athena-gym/,
  /athena-api/,
  /athenagym/i,
  /ATHENA GYM/,
  /Administrador Athena/,
  /branding\/athena/,
  /themeRaw === 'athena'/,
  /\^athena-\//,
  /ATHENA_E2E_/,
  /fallback ATHENA_/,
  /localStorage\.(getItem|removeItem)\('athena/,
  /Rename Athena → Movvo/,
  /legado/i,
  /Não usar/i,
];

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css', '.txt']);

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
  const n = file.replace(/\\/g, '/');
  return SKIP_FILE.some((re) => re.test(n));
}

function transform(content) {
  let next = content;
  for (const [from, to] of SYMBOLS) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  const lines = next.split('\n');
  return lines
    .map((line) => {
      if (ALLOW_LINE.some((re) => re.test(line))) return line;
      let l = line;
      for (const [re, to] of LINE_PRODUCT) {
        // LINE_PRODUCT uses global regexes — apply carefully per line for simple ones
        if (re.global) {
          re.lastIndex = 0;
          l = l.replace(re, to);
        } else if (re.test(l)) {
          l = l.replace(re, to);
        }
      }
      return l;
    })
    .join('\n');
}

let n = 0;
for (const r of ROOTS) {
  if (!fs.existsSync(r)) continue;
  for (const file of walk(r)) {
    if (shouldSkipFile(file)) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = transform(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      n += 1;
    }
  }
}

// BrandingProvider: import from movvo path
const bp = path.join(root, 'platform/apps/web/src/components/BrandingProvider.tsx');
if (fs.existsSync(bp)) {
  let t = fs.readFileSync(bp, 'utf8');
  const u = t.replace(
    "from '@movvo/shared/branding/athena'",
    "from '@movvo/shared/branding/movvo'",
  );
  if (u !== t) {
    fs.writeFileSync(bp, u);
    n += 1;
  }
}

console.log(`rename-mixed-pass2: changed ${n} files`);
