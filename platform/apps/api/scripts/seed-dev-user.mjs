/**
 * Seeds DEV test user into Supabase (Auth + profiles/RBAC).
 * Usage (from platform/apps/api): node scripts/seed-dev-user.mjs
 * Reads apps/api/.env
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const envText = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env');
  process.exit(1);
}

const USER_ID = '99999999-9999-9999-9999-999999999999';
const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const UNIT_ID = '22222222-2222-2222-2222-222222222222';
const ROLE_ADMIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
const EMAIL = 'teste@athena.local';
const PASSWORD = 'teste123';

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Ensure company/unit exist (idempotent)
  await admin.from('companies').upsert({
    id: COMPANY_ID,
    name: 'ATHENA GYM',
    legal_name: 'ATHENA GYM ACADEMIA LTDA',
    document: '12.345.678/0001-90',
    status: 'active',
  });
  await admin.from('units').upsert({
    id: UNIT_ID,
    company_id: COMPANY_ID,
    name: 'ATHENA GYM Matriz',
    code: 'MX',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
  });

  // Auth user (needed for profiles.id FK)
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = listed.data?.users?.find((u) => u.id === USER_ID || u.email === EMAIL);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Usuario Teste DEV' },
    });
    if (error) throw error;
    console.log('Updated auth user', existing.id);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      id: USER_ID,
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Usuario Teste DEV' },
    });
    if (error) throw error;
    console.log('Created auth user', data.user?.id);
  }

  const { error: pErr } = await admin.from('profiles').upsert({
    id: USER_ID,
    full_name: 'Usuario Teste DEV',
    email: EMAIL,
    company_id: COMPANY_ID,
    default_unit_id: UNIT_ID,
    status: 'active',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    deleted_at: null,
  });
  if (pErr) throw pErr;
  console.log('Upserted profile');

  const { error: mErr } = await admin.from('memberships').upsert(
    {
      profile_id: USER_ID,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
      role: 'admin',
      status: 'active',
      deleted_at: null,
    },
    { onConflict: 'profile_id,company_id,role' },
  );
  if (mErr) throw mErr;
  console.log('Upserted membership');

  const { data: ur } = await admin
    .from('user_roles')
    .select('id')
    .eq('profile_id', USER_ID)
    .eq('role_id', ROLE_ADMIN)
    .eq('company_id', COMPANY_ID)
    .is('deleted_at', null)
    .maybeSingle();

  if (!ur) {
    const { error: urErr } = await admin.from('user_roles').insert({
      profile_id: USER_ID,
      role_id: ROLE_ADMIN,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
    });
    if (urErr) throw urErr;
    console.log('Inserted user_roles');
  } else {
    console.log('user_roles already present');
  }

  console.log('\nOK — login DEV: %s / %s', EMAIL, PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
