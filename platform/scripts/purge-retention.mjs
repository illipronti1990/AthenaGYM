#!/usr/bin/env node
/**
 * Retention purge job — run via cron / GitHub Action / edge schedule.
 * Usage: node scripts/purge-retention.mjs [companyId]
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or call API with bearer).
 */
const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const token = process.env.PURGE_BEARER_TOKEN;
const companyId = process.argv[2] || '';

async function main() {
  if (!token) {
    console.error('Set PURGE_BEARER_TOKEN (admin JWT)');
    process.exit(1);
  }
  const url = `${API}/security/retention/purge${companyId ? `?companyId=${companyId}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const body = await res.text();
  console.log(res.status, body);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
