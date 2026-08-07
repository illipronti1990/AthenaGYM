import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD, E2E_STUDENT_EMAIL, E2E_TRAINER_EMAIL } from './helpers/e2eEnv';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = E2E_EMAIL;
const DEV_PASSWORD = E2E_PASSWORD;

async function login(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API}/auth/dev-login`, {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; access_token?: string };
  return body.accessToken || body.access_token || null;
}

test.describe('Acesso G-6 smoke', () => {
  test('presence without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/presence`);
    expect(res.status()).toBe(401);
  });

  test('acesso page redirects unauthenticated to login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/acesso`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/operations redirects toward acesso when unauthenticated', async ({
    request,
  }) => {
    const res = await request.get(`${WEB}/app/operations`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|acesso/);
    }
  });

  test('authenticated access flows: rules, presence, live, checkin deny/allow', async ({
    request,
  }) => {
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const rulesGet = await request.get(`${API}/access/rules`, { headers });
    expect(rulesGet.status()).toBe(200);
    const rules = await rulesGet.json();
    expect(rules).toHaveProperty('maxCheckinsPerDay');
    expect(rules).toHaveProperty('minIntervalMinutes');

    const patch = await request.patch(`${API}/access/rules`, {
      headers,
      data: {
        maxCheckinsPerDay: rules.maxCheckinsPerDay || 2,
        minIntervalMinutes: Math.max(0, Number(rules.minIntervalMinutes) || 2),
        blockOverdue: true,
        blockExpiredPlan: true,
        blockFrozen: true,
      },
    });
    expect(patch.status()).toBeLessThan(300);
    const patched = await patch.json();
    expect(patched.blockOverdue).toBe(true);

    const presence = await request.get(`${API}/presence`, { headers });
    expect(presence.status()).toBe(200);
    const presenceBody = await presence.json();
    expect(presenceBody).toHaveProperty('present');
    expect(presenceBody).toHaveProperty('presentCount');

    const live = await request.get(`${API}/access/live?limit=10`, { headers });
    expect(live.status()).toBe(200);
    expect(Array.isArray(await live.json())).toBe(true);

    const dash = await request.get(`${API}/operations/dashboard`, { headers });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('checkinsToday');

    const students = await request.get(`${API}/alunos?limit=5`, { headers });
    expect(students.status()).toBe(200);
    const studentsBody = await students.json();
    const list = Array.isArray(studentsBody)
      ? studentsBody
      : studentsBody.items || studentsBody.data || [];
    const active = list.find(
      (s: { status?: string }) => String(s.status || '').toLowerCase() === 'active',
    );

    if (active?.id) {
      const checkin = await request.post(`${API}/checkins`, {
        headers,
        data: { studentId: active.id, method: 'manual' },
      });
      // May allow or deny depending on plan/overdue — both are valid G-6 outcomes
      expect([200, 201, 403, 400]).toContain(checkin.status());
      if (checkin.status() === 403) {
        const body = await checkin.json();
        const msg =
          typeof body.message === 'string'
            ? body.message
            : body.message?.message || body.message?.code || '';
        expect(String(msg).length).toBeGreaterThan(0);
      }

      // Duplicate interval should reject after a successful check-in
      if (checkin.ok()) {
        const dup = await request.post(`${API}/checkins`, {
          headers,
          data: { studentId: active.id, method: 'manual' },
        });
        expect([400, 403]).toContain(dup.status());
      }
    }

    const agenda = await request.get(`${API}/checkins/agenda`, { headers });
    expect(agenda.status()).toBe(200);
    expect(Array.isArray(await agenda.json())).toBe(true);
  });
});
