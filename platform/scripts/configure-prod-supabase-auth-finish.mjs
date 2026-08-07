/**
 * Completa Site URL + Redirect URLs no Supabase Dashboard (Playwright).
 * Requer Chrome com sessão Supabase já logada no profile usado.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import path from 'node:path';

const PROJECT = 'jvwcgjfszpzifyfbwtqf';
const PAGE = `https://supabase.com/dashboard/project/${PROJECT}/auth/url-configuration`;
const SITE = 'https://movvoerp.com.br';
const NEED = [
  'https://movvoerp.com.br/**',
  'https://movvoerp.com.br/login',
  'https://www.movvoerp.com.br/**',
  'https://www.movvoerp.com.br/login',
  'https://athena-gym.vercel.app/**',
  'https://athena-gym.vercel.app/login',
  'http://localhost:3000/**',
  'http://localhost:3000/login',
];

const localAppData = process.env.LOCALAPPDATA || '';
const candidates = [
  path.join(localAppData, 'Google/Chrome/User Data/PlaywrightMovvoAuth'),
  path.join(localAppData, 'Google/Chrome/User Data/PlaywrightMovvo'),
].filter((p) => existsSync(p));

if (!candidates.length) {
  console.error('Nenhum profile Chrome Playwright encontrado.');
  process.exit(1);
}

const userData = candidates[0];
console.log('profile:', userData);

const context = await chromium.launchPersistentContext(userData, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 960 },
  args: ['--disable-blink-features=AutomationControlled'],
});

const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(45_000);

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForTimeout(5000);

const content = page.locator('#main');
await content.waitFor({ state: 'visible', timeout: 60_000 });

async function pageText() {
  return content.innerText();
}

async function ensureSiteUrl() {
  const siteInput = page
    .getByLabel(/Site URL/i)
    .or(page.locator('input').filter({ hasText: '' }).first())
    .first();

  // Prefer labeled input
  let input = page.getByLabel(/Site URL/i);
  if ((await input.count()) === 0) {
    input = page.locator('#main input[type="url"], #main input[type="text"]').first();
  }

  const current = await input.inputValue().catch(() => '');
  console.log('site_url atual:', current || '(vazio)');
  if (current.replace(/\/$/, '') === SITE) {
    console.log('Site URL já OK');
    return;
  }

  await input.click({ clickCount: 3 });
  await input.fill(SITE);
  const save = page.getByRole('button', { name: /Save|Salvar/i }).first();
  if (await save.isVisible().catch(() => false)) {
    if (await save.isEnabled().catch(() => false)) {
      await save.click();
      await page.waitForTimeout(2000);
      console.log('Site URL salvo');
    }
  }
}

async function addRedirect(url) {
  const text = await pageText();
  if (text.includes(url)) {
    console.log('já tem:', url);
    return true;
  }

  await page.getByRole('button', { name: /^Add URL$/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 15_000 });

  const inp = dialog.locator('input').first();
  await inp.waitFor({ state: 'visible' });
  await inp.fill('');
  await inp.fill(url);
  await page.waitForTimeout(600);

  // Prefer enabled primary action
  let clicked = false;
  const candidatesBtn = [
    dialog.getByRole('button', { name: /^Add URL$/i }),
    dialog.getByRole('button', { name: /^Add$/i }),
    dialog.getByRole('button', { name: /^Save$/i }),
    dialog.locator('button[type="submit"]'),
  ];

  for (const btn of candidatesBtn) {
    if ((await btn.count()) === 0) continue;
    const target = btn.first();
    for (let i = 0; i < 16; i++) {
      if (await target.isEnabled().catch(() => false)) {
        await target.click();
        clicked = true;
        break;
      }
      await page.waitForTimeout(200);
    }
    if (clicked) break;
  }

  if (!clicked) {
    await inp.press('Enter');
  }

  // Wait dialog close or list update
  await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);

  const ok = (await pageText()).includes(url);
  console.log(ok ? 'adicionado:' : 'FALHOU:', url);
  if (!ok) {
    // close leftover dialog
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }
  return ok;
}

await ensureSiteUrl();

const results = [];
for (const u of NEED) {
  results.push([u, await addRedirect(u)]);
}

// Final Save if present
const saveAll = page.getByRole('button', { name: /Save|Salvar/i }).first();
if (await saveAll.isVisible().catch(() => false)) {
  if (await saveAll.isEnabled().catch(() => false)) {
    await saveAll.click();
    await page.waitForTimeout(2000);
    console.log('Save final clicado');
  }
}

const finalText = await pageText();
await page.screenshot({ path: 'scripts/sb-auth-final.png', fullPage: true });

console.log('\n=== RESULTADO ===');
console.log('Site URL esperado:', SITE);
for (const [u, ok] of results) {
  const present = finalText.includes(u);
  console.log(`${present || ok ? 'OK' : 'MISSING'}  ${u}`);
}

const missing = NEED.filter((u) => !finalText.includes(u));
if (missing.length) {
  console.log('\nAinda faltando:', missing.join(', '));
} else {
  console.log('\nTodas as redirect URLs presentes.');
}

await page.waitForTimeout(2000);
await context.close();
process.exit(missing.length ? 2 : 0);
