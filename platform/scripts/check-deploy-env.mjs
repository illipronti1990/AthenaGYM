#!/usr/bin/env node
/**
 * Valida se as variáveis mínimas de produção estão definidas.
 * Uso:
 *   node scripts/check-deploy-env.mjs api
 *   node scripts/check-deploy-env.mjs web
 */

const target = process.argv[2] || 'all';

const apiRequired = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CORS_ORIGINS',
];

const webRequired = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_API_URL',
];

function check(name, keys) {
  const missing = keys.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (missing.length) {
    console.error(`[${name}] faltando: ${missing.join(', ')}`);
    return false;
  }
  console.log(`[${name}] OK (${keys.length} vars)`);
  return true;
}

let ok = true;
if (target === 'api' || target === 'all') ok = check('api', apiRequired) && ok;
if (target === 'web' || target === 'all') ok = check('web', webRequired) && ok;

if (process.env.DEV_AUTH_ENABLED === 'true' || process.env.NEXT_PUBLIC_DEV_AUTH === 'true') {
  console.warn('AVISO: DEV_AUTH está true — desligue em produção.');
}

process.exit(ok ? 0 : 1);
