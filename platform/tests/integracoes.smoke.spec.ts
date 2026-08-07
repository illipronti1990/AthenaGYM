import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD, E2E_STUDENT_EMAIL, E2E_TRAINER_EMAIL } from './helpers/e2eEnv';
import { createHmac } from 'crypto';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = E2E_EMAIL;
const DEV_PASSWORD = E2E_PASSWORD;
const WEBHOOK_SECRET = process.env.PARTNER_WEBHOOK_SECRET || 'movvo-partner-webhook-dev';

async function login(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API}/auth/dev-login`, {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; access_token?: string };
  return body.accessToken || body.access_token || null;
}

function sign(body: string) {
  return createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

test.describe('Integrações G-6 smoke', () => {
  test('integracoes page redirects unauthenticated to login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/integracoes`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/operations/parceiros redirects toward integracoes', async ({ request }) => {
    const res = await request.get(`${WEB}/app/operations/parceiros`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|integracoes/);
    }
  });

  test('hub, dashboard, sync and HMAC webhook', async ({ request }) => {
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const hub = await request.get(`${API}/integrations`, { headers });
    expect(hub.status()).toBe(200);
    const partners = await hub.json();
    expect(Array.isArray(partners)).toBe(true);
    expect(partners.some((p: { slug: string }) => p.slug === 'wellhub')).toBe(true);

    const dash = await request.get(`${API}/integrations/wellhub/dashboard`, { headers });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('checkinsToday');
    expect(dashBody).toHaveProperty('pendingApprovals');

    const sync = await request.post(`${API}/integrations/wellhub/sync-members`, {
      headers,
      data: {},
    });
    expect(sync.status()).toBeLessThan(300);
    const syncBody = await sync.json();
    expect(syncBody).toHaveProperty('synced');

    const payload = {
      event: 'checkin',
      externalMemberId: `smoke_wh_${Date.now()}`,
      memberName: 'Smoke Wellhub',
      document: `9${String(Date.now()).slice(-10)}`,
      companyId: '11111111-1111-1111-1111-111111111111',
      unitId: '22222222-2222-2222-2222-222222222222',
    };
    const raw = JSON.stringify(payload);

    const bad = await request.post(`${API}/integrations/webhooks/wellhub`, {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'invalid',
        'x-company-id': '11111111-1111-1111-1111-111111111111',
      },
      data: payload,
    });
    expect(bad.status()).toBe(401);

    const ok = await request.post(`${API}/integrations/webhooks/wellhub`, {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': sign(raw),
        'x-company-id': '11111111-1111-1111-1111-111111111111',
      },
      data: payload,
    });
    expect(ok.status()).toBeLessThan(300);
    const okBody = await ok.json();
    expect(okBody.ok).toBe(true);

    const dup = await request.post(`${API}/integrations/webhooks/wellhub`, {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': sign(raw),
        'x-company-id': '11111111-1111-1111-1111-111111111111',
      },
      data: payload,
    });
    expect(dup.status()).toBeLessThan(300);
    const dupBody = await dup.json();
    expect(dupBody.idempotent).toBe(true);

    const logs = await request.get(`${API}/integrations/logs?provider=wellhub`, { headers });
    expect(logs.status()).toBe(200);
    expect(Array.isArray(await logs.json())).toBe(true);
  });
});
