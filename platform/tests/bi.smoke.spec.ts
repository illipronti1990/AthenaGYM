import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD, E2E_STUDENT_EMAIL, E2E_TRAINER_EMAIL } from './helpers/e2eEnv';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = E2E_EMAIL;
const DEV_PASSWORD = E2E_PASSWORD;

async function login(
  request: import('@playwright/test').APIRequestContext,
  email = DEV_EMAIL,
  password = DEV_PASSWORD,
) {
  const res = await request.post(`${API}/auth/dev-login`, {
    data: { email, password },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; access_token?: string };
  return body.accessToken || body.access_token || null;
}

test.describe('BI G-12 smoke', () => {
  test('executive without token gets 401', async ({ request }) => {
    const res = await request.get(`${API}/executive`);
    expect(res.status()).toBe(401);
  });

  test('bi hub redirects unauthenticated toward login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/bi`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/analytics redirects toward bi', async ({ request }) => {
    const res = await request.get(`${WEB}/app/analytics`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|bi/);
    }
  });

  test('G-12 critical API flows', async ({ request }) => {
    test.setTimeout(180_000);
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const executive = await request.get(`${API}/executive`, { headers });
    expect([200, 403]).toContain(executive.status());
    if (executive.ok()) {
      const body = await executive.json();
      expect(body).toHaveProperty('revenueMonth');
      expect(body).toHaveProperty('mrr');
      expect(body).toHaveProperty('occupancy');
      expect(typeof body.revenueMonth).toBe('number');
    }

    const kpis = await request.get(`${API}/analytics/kpis`, { headers });
    expect([200, 403]).toContain(kpis.status());
    if (kpis.ok()) {
      const list = await kpis.json();
      expect(Array.isArray(list)).toBeTruthy();
      expect(list.length).toBeGreaterThan(0);
    }

    const sync = await request.post(`${API}/analytics/warehouse/sync`, { headers });
    expect([200, 201, 403]).toContain(sync.status());

    const insights = await request.post(`${API}/ai/insights`, {
      headers,
      data: { question: 'Onde atacar a inadimplência?' },
    });
    expect([200, 201, 403]).toContain(insights.status());
    if (insights.ok()) {
      const body = await insights.json();
      expect(['movvo-rules', 'ollama']).toContain(body.provider);
      expect(Array.isArray(body.insights)).toBeTruthy();
      expect(body.insights.length).toBeGreaterThan(0);
    }

    const forecasts = await request.get(`${API}/analytics/forecasts`, { headers });
    expect([200, 403]).toContain(forecasts.status());
    if (forecasts.ok()) {
      const list = await forecasts.json();
      expect(Array.isArray(list)).toBeTruthy();
      expect(list.some((f: { type: string }) => f.type === 'revenue_month')).toBeTruthy();
    }

    const runForecast = await request.post(`${API}/analytics/predictions/run`, {
      headers,
      data: { type: 'revenue_month' },
    });
    expect([200, 201, 403]).toContain(runForecast.status());

    const heatmaps = await request.get(`${API}/analytics/heatmaps?type=hours`, { headers });
    expect([200, 403]).toContain(heatmaps.status());
    if (heatmaps.ok()) {
      const body = await heatmaps.json();
      expect(body.available).toBe(true);
      expect(Array.isArray(body.cells)).toBeTruthy();
    }

    const equipment = await request.get(`${API}/analytics/heatmaps?type=equipment`, { headers });
    if (equipment.ok()) {
      const body = await equipment.json();
      expect(body.available).toBe(false);
      expect(body.reason).toBe('integration_required');
    }

    const compare = await request.get(`${API}/analytics/compare?metric=revenue&period=month`, {
      headers,
    });
    expect([200, 403]).toContain(compare.status());
    if (compare.ok()) {
      const body = await compare.json();
      expect(body).toHaveProperty('deltaPct');
    }

    const goals = await request.get(`${API}/analytics/goals`, { headers });
    expect([200, 403]).toContain(goals.status());
    if (goals.ok()) {
      const start = new Date();
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const createGoal = await request.post(`${API}/analytics/goals`, {
        headers,
        data: {
          metric: 'revenue',
          targetValue: 50000,
          periodStart: start.toISOString().slice(0, 10),
          periodEnd: end.toISOString().slice(0, 10),
          label: 'Meta smoke G12',
        },
      });
      expect([200, 201, 403, 500]).toContain(createGoal.status());
    }

    const alertsRefresh = await request.post(`${API}/analytics/alerts/refresh`, { headers });
    expect([200, 201, 403, 500]).toContain(alertsRefresh.status());

    const alerts = await request.get(`${API}/analytics/alerts`, { headers });
    expect([200, 403, 500]).toContain(alerts.status());

    const chat = await request.post(`${API}/analytics/ai/chat`, {
      headers,
      data: { question: 'Quanto faturei no mês?' },
    });
    expect([200, 201, 403]).toContain(chat.status());
    if (chat.ok()) {
      const body = await chat.json();
      expect(['movvo-rules', 'ollama']).toContain(body.provider);
      expect(String(body.answer || '').length).toBeGreaterThan(5);
    }

    const exp = await request.post(`${API}/exports`, {
      headers,
      data: { format: 'csv', source: 'revenue' },
    });
    expect([200, 201, 403]).toContain(exp.status());
    if (exp.ok()) {
      const body = await exp.json();
      expect(body.status).toBe('done');
      expect(String(body.fileUrl || '')).toContain('data:text/csv');
    }

    const connectors = await request.get(`${API}/analytics/connectors`, { headers });
    expect([200, 403, 500]).toContain(connectors.status());
    if (connectors.ok()) {
      const list = await connectors.json();
      expect(Array.isArray(list)).toBeTruthy();
      expect(list.some((c: { provider: string }) => c.provider === 'powerbi')).toBeTruthy();
    }

    const commercial = await request.get(`${API}/analytics/commercial`, { headers });
    expect([200, 403]).toContain(commercial.status());

    const benchmark = await request.get(`${API}/analytics/benchmark?dimension=plan`, { headers });
    expect([200, 403]).toContain(benchmark.status());
  });
});
