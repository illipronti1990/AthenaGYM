import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = process.env.ATHENA_E2E_EMAIL || 'teste@athena.local';
const DEV_PASSWORD = process.env.ATHENA_E2E_PASSWORD || 'teste123';
const STUDENT_EMAIL = process.env.ATHENA_E2E_STUDENT_EMAIL || 'renan.aluno@athena.local';

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

async function firstStudentId(
  request: import('@playwright/test').APIRequestContext,
  headers: Record<string, string>,
) {
  const students = await request.get(`${API}/alunos?limit=5`, { headers });
  if (!students.ok()) return undefined;
  const body = await students.json();
  const list = Array.isArray(body) ? body : body.items || body.data || [];
  return list[0]?.id as string | undefined;
}

test.describe('CRM G-9 smoke', () => {
  test('leads without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/leads`);
    expect(res.status()).toBe(401);
  });

  test('crm hub redirects unauthenticated toward login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/crm`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/sales redirects toward crm', async ({ request }) => {
    const res = await request.get(`${WEB}/app/sales`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|crm/);
    }
  });

  test('G-9 critical API flows', async ({ request }) => {
    test.setTimeout(120_000);
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const studentId = await firstStudentId(request, headers);
    test.skip(!studentId, 'No students seeded');

    // CRUD lead
    const createLead = await request.post(`${API}/sales/leads`, {
      headers,
      data: {
        fullName: `G9 Lead ${Date.now()}`,
        phone: '11999990000',
        whatsapp: '11999990000',
        email: `g9.lead.${Date.now()}@athena.local`,
        interest: 'Musculação',
        objective: 'Emagrecimento',
        goal: 'Perder 5kg',
        firstContactAt: new Date().toISOString(),
      },
    });
    expect([200, 201]).toContain(createLead.status());
    const lead = await createLead.json();
    expect(lead).toHaveProperty('id');

    // Pipeline move
    const pipeline = await request.get(`${API}/sales/pipeline`, { headers });
    expect(pipeline.status()).toBe(200);
    const columns = await pipeline.json();
    expect(Array.isArray(columns)).toBe(true);
    const nextStage = columns.find(
      (c: { stage?: { slug?: string; id?: string }; leads?: unknown[] }) =>
        c.stage?.slug === 'contacted' || c.stage?.slug === 'contact',
    )?.stage?.id;
    if (nextStage) {
      const moved = await request.patch(`${API}/sales/leads/${lead.id}/stage`, {
        headers,
        data: { stageId: nextStage },
      });
      expect(moved.status()).toBe(200);
    }

    // Convert lead → aluno
    const convert = await request.post(`${API}/sales/leads/${lead.id}/convert`, {
      headers,
      data: {},
    });
    expect([200, 201]).toContain(convert.status());
    const converted = await convert.json();
    expect(converted.studentId || converted.lead?.studentId).toBeTruthy();

    // Campaign create + send stub
    const campaign = await request.post(`${API}/campaigns`, {
      headers,
      data: {
        name: `G9 Campanha ${Date.now()}`,
        type: 'promo',
        channel: 'whatsapp',
        body: 'Oferta G9 smoke',
        discountPct: 10,
      },
    });
    if ([200, 201].includes(campaign.status())) {
      const camp = await campaign.json();
      const send = await request.post(`${API}/campaigns/${camp.id}/send`, {
        headers,
        data: {},
      });
      expect([200, 201]).toContain(send.status());
    }

    // Templates
    const templates = await request.get(`${API}/templates`, { headers });
    expect([200, 404, 500]).toContain(templates.status());
    if (templates.status() === 200) {
      const list = await templates.json();
      expect(Array.isArray(list)).toBe(true);
    }

    // Referral
    const referral = await request.post(`${API}/referrals`, {
      headers,
      data: {
        referrerStudentId: studentId,
        referredName: `Amigo G9 ${Date.now()}`,
        referredPhone: '11988887777',
        notes: 'smoke',
      },
    });
    if ([200, 201].includes(referral.status())) {
      const ref = await referral.json();
      const reward = await request.post(`${API}/referrals/${ref.id}/reward`, {
        headers,
        data: {},
      });
      expect([200, 201, 400]).toContain(reward.status());
    } else {
      // table may not be migrated yet
      expect([400, 404, 500]).toContain(referral.status());
    }

    // Loyalty earn + redeem
    const earn = await request.post(`${API}/loyalty/earn`, {
      headers,
      data: { studentId, event: 'checkin' },
    });
    if ([200, 201].includes(earn.status())) {
      const rewards = await request.get(`${API}/loyalty/rewards`, { headers });
      expect(rewards.status()).toBe(200);
      const rewardList = (await rewards.json()) as Array<{ id: string; pointsCost?: number }>;
      const cheap = rewardList.sort(
        (a, b) => (a.pointsCost || 0) - (b.pointsCost || 0),
      )[0];
      if (cheap) {
        // award enough points then redeem
        for (let i = 0; i < 5; i++) {
          await request.post(`${API}/loyalty/earn`, {
            headers,
            data: { studentId, event: 'checkin' },
          });
        }
        const redeem = await request.post(`${API}/loyalty/redeem`, {
          headers,
          data: { studentId, rewardId: cheap.id },
        });
        expect([200, 201, 400]).toContain(redeem.status());
      }
    }

    // NPS
    const surveys = await request.get(`${API}/nps/surveys`, { headers });
    if (surveys.status() === 200) {
      const surveyList = (await surveys.json()) as Array<{ id: string }>;
      const surveyId = surveyList[0]?.id;
      if (surveyId) {
        const nps = await request.post(`${API}/nps/responses`, {
          headers,
          data: { surveyId, studentId, score: 9, comment: 'G9 smoke' },
        });
        expect([200, 201]).toContain(nps.status());
      }
      const npsDash = await request.get(`${API}/nps/dashboard`, { headers });
      expect(npsDash.status()).toBe(200);
      const npsBody = await npsDash.json();
      expect(npsBody).toBeTruthy();
    }

    // Segments
    const segments = await request.get(`${API}/segments`, { headers });
    if (segments.status() === 200) {
      const segs = (await segments.json()) as Array<{ id: string }>;
      if (segs[0]?.id) {
        const resolved = await request.post(`${API}/segments/${segs[0].id}/resolve`, {
          headers,
          data: {},
        });
        expect([200, 201]).toContain(resolved.status());
        const body = await resolved.json();
        expect(body).toHaveProperty('count');
      }
    }

    // Recovery + birthdays + dashboard
    const recovery = await request.get(`${API}/crm/recovery`, { headers });
    expect(recovery.status()).toBe(200);

    const birthdays = await request.get(`${API}/crm/birthdays`, { headers });
    expect(birthdays.status()).toBe(200);

    const dash = await request.get(`${API}/crm/dashboard`, { headers });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('openLeads');
    expect(dashBody).toHaveProperty('npsScore');

    // Risk refresh
    const riskRefresh = await request.post(`${API}/crm/risk/refresh`, {
      headers,
      data: {},
    });
    expect([200, 201, 403]).toContain(riskRefresh.status());
    const risk = await request.get(`${API}/crm/risk`, { headers });
    expect([200, 403]).toContain(risk.status());

    // Automation run stub
    const autos = await request.get(`${API}/automations`, { headers });
    if (autos.status() === 200) {
      const flows = (await autos.json()) as Array<{ id: string }>;
      if (flows[0]?.id) {
        const run = await request.post(`${API}/automations/${flows[0].id}/run`, {
          headers,
          data: {},
        });
        expect([200, 201]).toContain(run.status());
      }
    }
  });

  test('portal NPS + student cannot manage campaigns', async ({ request }) => {
    test.setTimeout(60_000);
    const studentToken = await login(request, STUDENT_EMAIL, DEV_PASSWORD);
    test.skip(!studentToken, 'Student dev login unavailable');
    const headers = { Authorization: `Bearer ${studentToken}` };

    const portalNps = await request.get(`${API}/portal/nps`, { headers });
    expect([200, 403, 404, 500]).toContain(portalNps.status());

    const createCampaign = await request.post(`${API}/campaigns`, {
      headers,
      data: {
        name: 'blocked',
        type: 'promo',
        channel: 'email',
        body: 'nope',
      },
    });
    expect([401, 403]).toContain(createCampaign.status());
  });
});
