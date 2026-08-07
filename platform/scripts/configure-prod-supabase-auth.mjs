/**
 * Configura Site URL + Redirect URLs do Auth no Supabase (Management API).
 *
 * Uso:
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/configure-prod-supabase-auth.mjs
 *
 * Token: https://supabase.com/dashboard/account/tokens
 */
const REF = process.env.SUPABASE_PROJECT_REF || 'jvwcgjfszpzifyfbwtqf';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.argv[2] || '';

const SITE_URL = 'https://movvoerp.com.br';
const ALLOW = [
  'https://movvoerp.com.br/**',
  'https://movvoerp.com.br/login',
  'https://www.movvoerp.com.br/**',
  'https://www.movvoerp.com.br/login',
  'https://athena-gym.vercel.app/**',
  'https://athena-gym.vercel.app/login',
  'http://localhost:3000/**',
  'http://localhost:3000/login',
].join(',');

if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (Personal Access Token).');
  console.error('Crie em: https://supabase.com/dashboard/account/tokens');
  console.error('Depois: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/configure-prod-supabase-auth.mjs');
  process.exit(1);
}

// Prefer platform API (mesmo contrato do Dashboard). Fallback: Management API.
const urls = [
  `https://api.supabase.com/platform/auth/${REF}/config`,
  `https://api.supabase.com/v1/projects/${REF}/config/auth`,
];

let body;
let lastErr = '';
for (const url of urls) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Platform API espera UPPER_SNAKE
      SITE_URL,
      URI_ALLOW_LIST: ALLOW,
      site_url: SITE_URL,
      uri_allow_list: ALLOW,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    lastErr = `${res.status} ${text.slice(0, 300)}`;
    continue;
  }
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  console.log('OK via', url);
  break;
}

if (!body) {
  console.error('PATCH failed', lastErr);
  process.exit(1);
}

console.log('OK Auth config atualizado');
console.log('site_url:', body.SITE_URL || body.site_url || SITE_URL);
console.log('uri_allow_list:', body.URI_ALLOW_LIST || body.uri_allow_list || ALLOW);
