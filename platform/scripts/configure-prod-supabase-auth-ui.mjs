/**
 * Abre o Chrome na página de Auth URL Configuration e tenta
 * preencher Site URL + Redirect URLs (requer sessão logada no Supabase).
 */
import { chromium } from 'playwright';

const PROJECT = 'jvwcgjfszpzifyfbwtqf';
const PAGE =
  `https://supabase.com/dashboard/project/${PROJECT}/auth/url-configuration`;

const SITE = 'https://movvoerp.com.br';
const REDIRECTS = [
  'https://movvoerp.com.br/**',
  'https://movvoerp.com.br/login',
  'https://www.movvoerp.com.br/**',
  'https://www.movvoerp.com.br/login',
  'https://athena-gym.vercel.app/**',
  'https://athena-gym.vercel.app/login',
  'http://localhost:3000/**',
  'http://localhost:3000/login',
].join('\n');

const userData =
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data\\PlaywrightMovvo`;

const context = await chromium.launchPersistentContext(userData, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});

const page = context.pages()[0] || (await context.newPage());
await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 });
console.log('Aberto:', PAGE);
console.log('Se pedir login, autentique no Chrome. Aguardando 12s…');
await page.waitForTimeout(12_000);

async function tryFill(locator, value, label) {
  try {
    const el = locator.first();
    if ((await el.count()) === 0) return false;
    await el.fill(value);
    console.log('OK:', label);
    return true;
  } catch (e) {
    console.log('skip', label, e.message);
    return false;
  }
}

await tryFill(page.getByLabel(/Site URL/i), SITE, 'Site URL (label)');
await tryFill(page.locator('input[name="siteURL"], input[name="site_url"]'), SITE, 'Site URL (name)');
await tryFill(page.getByLabel(/Redirect URLs/i), REDIRECTS, 'Redirect URLs (label)');
await tryFill(page.locator('textarea'), REDIRECTS, 'Redirect URLs (textarea)');

const save = page.getByRole('button', { name: /Save|Salvar/i }).first();
try {
  if (await save.isVisible({ timeout: 5000 })) {
    await save.click();
    console.log('Save clicado');
    await page.waitForTimeout(4000);
  } else {
    console.log('Save não visível — salve manualmente na janela.');
  }
} catch {
  console.log('Save não encontrado — salve manualmente na janela.');
}

console.log('Browser aberto 25s para confirmação visual…');
await page.waitForTimeout(25_000);
await context.close();
console.log('Done');
