#!/usr/bin/env node
/**
 * Gera arquivos .env.production.local (gitignored) a partir dos .env locais,
 * ajustando flags de produção. Não imprime segredos.
 *
 * Uso: node scripts/prepare-prod-env.mjs [API_PUBLIC_URL] [WEB_PUBLIC_URL]
 * Ex.: node scripts/prepare-prod-env.mjs https://athena-api.onrender.com https://athena-gym.vercel.app
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiEnvPath = resolve(root, 'apps/api/.env');
const webEnvPath = resolve(root, 'apps/web/.env.local');

const apiPublic = (process.argv[2] || '').replace(/\/$/, '');
const webPublic = (process.argv[3] || '').replace(/\/$/, '');

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    out[t.slice(0, i)] = t.slice(i + 1);
  }
  return out;
}

function serialize(env) {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

if (!existsSync(apiEnvPath) || !existsSync(webEnvPath)) {
  console.error('Faltam apps/api/.env ou apps/web/.env.local');
  process.exit(1);
}

const api = parseEnv(readFileSync(apiEnvPath, 'utf8'));
const web = parseEnv(readFileSync(webEnvPath, 'utf8'));

const apiOut = {
  ...api,
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  PORT: api.PORT || '3001',
  DEV_AUTH_ENABLED: 'false',
  CORS_ORIGINS: webPublic || api.CORS_ORIGINS || 'http://localhost:3000',
  PASSWORD_RESET_REDIRECT: webPublic
    ? `${webPublic}/login`
    : api.PASSWORD_RESET_REDIRECT || 'http://localhost:3000/login',
};

const webOut = {
  NEXT_PUBLIC_SUPABASE_URL: web.NEXT_PUBLIC_SUPABASE_URL || api.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: web.NEXT_PUBLIC_SUPABASE_ANON_KEY || api.SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: apiPublic
    ? `${apiPublic.replace(/\/api\/v1\/?$/, '')}/api/v1`
    : web.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  NEXT_PUBLIC_DEV_AUTH: 'false',
  NEXT_PUBLIC_GYM_INSTAGRAM:
    web.NEXT_PUBLIC_GYM_INSTAGRAM || 'https://www.instagram.com/athenagym.oficial/',
  NEXT_PUBLIC_GYM_WHATSAPP: web.NEXT_PUBLIC_GYM_WHATSAPP || api.whatsapp || '',
};

const apiOutPath = resolve(root, 'apps/api/.env.production.local');
const webOutPath = resolve(root, 'apps/web/.env.production.local');
writeFileSync(apiOutPath, serialize(apiOut));
writeFileSync(webOutPath, serialize(webOut));

console.log('Gerado (gitignored):');
console.log(' - apps/api/.env.production.local');
console.log(' - apps/web/.env.production.local');
console.log('');
console.log('Checklist rápido:');
console.log(' 1) Render: https://dashboard.render.com/blueprints');
console.log('    Repo: https://github.com/illipronti1990/AthenaGYM');
console.log('    Blueprint: render.yaml (raiz)');
console.log(' 2) Vercel: https://vercel.com/new');
console.log('    Root Directory: platform/apps/web');
console.log(' 3) Depois rode de novo com as URLs reais:');
console.log('    node scripts/prepare-prod-env.mjs https://SUA-API.onrender.com https://SEU-APP.vercel.app');
console.log(' 4) Supabase Auth URLs → Site URL = URL do Vercel');
if (!apiPublic || !webPublic) {
  console.log('');
  console.log('Aviso: URLs de produção ainda não informadas; CORS/API apontam para placeholders.');
}
