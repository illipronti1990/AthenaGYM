/**
 * Cria/atualiza 3 perfis demo (admin, aluno, professor) no Supabase Auth + RBAC.
 *
 * Uso (a partir de platform/apps/api):
 *   node scripts/seed-demo-users.mjs
 *   ENV_FILE=.env.production.local node scripts/seed-demo-users.mjs
 *
 * Senha padrão: Demo@123456 (override: DEMO_PASSWORD=...)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = process.env.ENV_FILE || '.env.production.local';
const envCandidates = [
  resolve(__dirname, `../${envFile}`),
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../../.env.production.local'),
];
const envPath = envCandidates.find((p) => existsSync(p));
if (!envPath) {
  console.error('Nenhum .env encontrado. Esperava apps/api/.env.production.local ou .env');
  process.exit(1);
}

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
  console.error('Missing SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em', envPath);
  process.exit(1);
}

const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const UNIT_ID = '22222222-2222-2222-2222-222222222222';
const ROLE = {
  admin: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  trainer: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
  student: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8',
};

const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@123456';
if (PASSWORD.length < 8) {
  console.error('DEMO_PASSWORD deve ter no mínimo 8 caracteres');
  process.exit(1);
}

const DEMOS = [
  {
    key: 'admin',
    email: 'admin.demo@movvoerp.com.br',
    fullName: 'Admin Demo Movvo',
    membershipRole: 'admin',
    roleId: ROLE.admin,
    stableId: 'a1111111-1111-4111-8111-111111111111',
  },
  {
    key: 'aluno',
    email: 'aluno.demo@movvoerp.com.br',
    fullName: 'Aluno Demo Movvo',
    membershipRole: 'student',
    roleId: ROLE.student,
    stableId: 'a2222222-2222-4222-8222-222222222222',
    studentId: 'a2222222-2222-4222-8222-222222222229',
  },
  {
    key: 'professor',
    email: 'professor.demo@movvoerp.com.br',
    fullName: 'Professor Demo Movvo',
    membershipRole: 'trainer',
    roleId: ROLE.trainer,
    stableId: 'a3333333-3333-4333-8333-333333333333',
  },
];

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureCompany() {
  const { error: cErr } = await admin.from('companies').upsert({
    id: COMPANY_ID,
    name: 'Athena Academia',
    legal_name: 'ATHENA ACADEMIA LTDA',
    document: '12.345.678/0001-90',
    status: 'active',
  });
  if (cErr) throw cErr;

  const { error: uErr } = await admin.from('units').upsert({
    id: UNIT_ID,
    company_id: COMPANY_ID,
    name: 'Athena Academia Matriz',
    code: 'MX',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
  });
  if (uErr) throw uErr;
}

async function upsertAuthUser(demo) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) throw listed.error;

  let user = listed.data?.users?.find(
    (u) => (u.email || '').toLowerCase() === demo.email.toLowerCase(),
  );

  if (user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: demo.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.fullName, demo_role: demo.key },
    });
    if (error) throw error;
    console.log(`✓ Auth atualizado (${demo.key}):`, user.id);
    return user.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    id: demo.stableId,
    email: demo.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: demo.fullName, demo_role: demo.key },
  });
  if (error) {
    // fallback sem id fixo se conflict
    const retry = await admin.auth.admin.createUser({
      email: demo.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.fullName, demo_role: demo.key },
    });
    if (retry.error) throw retry.error;
    console.log(`✓ Auth criado (${demo.key}):`, retry.data.user?.id);
    return retry.data.user.id;
  }
  console.log(`✓ Auth criado (${demo.key}):`, data.user?.id);
  return data.user.id;
}

async function upsertProfile(userId, demo) {
  const { error } = await admin.from('profiles').upsert({
    id: userId,
    full_name: demo.fullName,
    email: demo.email,
    company_id: COMPANY_ID,
    default_unit_id: UNIT_ID,
    status: 'active',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    deleted_at: null,
  });
  if (error) throw error;

  const { error: mErr } = await admin.from('memberships').upsert(
    {
      profile_id: userId,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
      role: demo.membershipRole,
      status: 'active',
      deleted_at: null,
    },
    { onConflict: 'profile_id,company_id,role' },
  );
  if (mErr) throw mErr;

  const { data: ur } = await admin
    .from('user_roles')
    .select('id')
    .eq('profile_id', userId)
    .eq('role_id', demo.roleId)
    .eq('company_id', COMPANY_ID)
    .is('deleted_at', null)
    .maybeSingle();

  if (!ur) {
    const { error: urErr } = await admin.from('user_roles').insert({
      profile_id: userId,
      role_id: demo.roleId,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
    });
    if (urErr) throw urErr;
  }

  if (demo.studentId) {
    const { error: sErr } = await admin.from('students').upsert({
      id: demo.studentId,
      company_id: COMPANY_ID,
      unit_id: UNIT_ID,
      registration_number: 'MOVVO-DEMO-ALUNO',
      full_name: demo.fullName,
      email: demo.email,
      cpf: '390.533.447-05',
      status: 'active',
      plan_name: 'Plano Demo',
      notes: `Usuário demo aluno — ${demo.email}`,
      deleted_at: null,
    });
    if (sErr) console.warn('students upsert:', sErr.message);
  }

  console.log(`✓ Profile/RBAC (${demo.key})`);
}

async function main() {
  console.log('Env:', envPath);
  console.log('Supabase:', url);
  await ensureCompany();

  for (const demo of DEMOS) {
    const userId = await upsertAuthUser(demo);
    await upsertProfile(userId, demo);
  }

  console.log('\n=== Contas demo (produção) ===');
  console.log(`Senha de todas: ${PASSWORD}`);
  for (const d of DEMOS) {
    console.log(`  ${d.key.padEnd(10)} ${d.email}`);
  }
  console.log('\nLogin: https://movvoerp.com.br/login');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
