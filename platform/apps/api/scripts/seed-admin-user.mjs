/**
 * Seeds production-style admin user into Supabase (Auth + profiles/RBAC).
 * Usage (from platform/apps/api):
 *   ADMIN_EMAIL=admin@athenagym.com ADMIN_PASSWORD='...' node scripts/seed-admin-user.mjs
 * Reads apps/api/.env for Supabase credentials.
 * Does not hardcode passwords in the repository.
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
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

const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const UNIT_ID = '22222222-2222-2222-2222-222222222222';
const ROLE_ADMIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@athenagym.com';
const PASSWORD = process.env.ADMIN_PASSWORD;
const FULL_NAME = process.env.ADMIN_NAME || 'Administrador Athena';

if (!PASSWORD || PASSWORD.length < 8) {
  console.error('Set ADMIN_PASSWORD (min 8 chars) in the environment.');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
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

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;
  let user = listed.data?.users?.find(
    (u) => (u.email || '').toLowerCase() === EMAIL.toLowerCase(),
  );

  if (user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) throw error;
    console.log('Updated auth user', user.id);
  } else {
    const id = randomUUID();
    const { data, error } = await admin.auth.admin.createUser({
      id,
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log('Created auth user', user?.id);
  }

  const userId = user.id;

  const { error: pErr } = await admin.from('profiles').upsert({
    id: userId,
    full_name: FULL_NAME,
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
      profile_id: userId,
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
    .eq('profile_id', userId)
    .eq('role_id', ROLE_ADMIN)
    .eq('company_id', COMPANY_ID)
    .is('deleted_at', null)
    .maybeSingle();

  if (!ur) {
    const { error: urErr } = await admin.from('user_roles').insert({
      profile_id: userId,
      role_id: ROLE_ADMIN,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
    });
    if (urErr) throw urErr;
    console.log('Inserted user_roles (admin)');
  } else {
    console.log('user_roles already present');
  }

  console.log('\nOK — admin pronto:', EMAIL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
