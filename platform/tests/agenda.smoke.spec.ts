import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD, E2E_STUDENT_EMAIL, E2E_TRAINER_EMAIL } from './helpers/e2eEnv';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = E2E_EMAIL;
const DEV_PASSWORD = E2E_PASSWORD;
const STUDENT_EMAIL = E2E_STUDENT_EMAIL;
const TRAINER_EMAIL = E2E_TRAINER_EMAIL;
const UNIT_ID = '22222222-2222-2222-2222-222222222222';

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
  expect(students.status()).toBe(200);
  const body = await students.json();
  const list = Array.isArray(body) ? body : body.items || body.data || [];
  return list[0]?.id as string | undefined;
}

function conflictCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const msg = (body as { message?: unknown }).message;
  if (msg && typeof msg === 'object' && msg !== null && 'code' in msg) {
    return String((msg as { code: string }).code);
  }
  if (typeof msg === 'string') return undefined;
  return (body as { code?: string }).code;
}

test.describe('Agenda G-8 smoke', () => {
  test('schedule without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/schedule`);
    expect(res.status()).toBe(401);
  });

  test('agenda hub redirects unauthenticated toward login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/agenda`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/operations/agenda redirects toward calendario', async ({ request }) => {
    const res = await request.get(`${WEB}/app/operations/agenda`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|agenda/);
    }
  });

  test('G-8 critical API flows', async ({ request }) => {
    test.setTimeout(120_000);
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const studentId = await firstStudentId(request, headers);
    test.skip(!studentId, 'No students seeded');

    const me = await request.get(`${API}/auth/me`, { headers });
    const meBody = me.ok() ? await me.json() : null;
    const profileId =
      meBody?.profile?.id || meBody?.auth?.userId || null;

    const offsetMs = 20 * 24 * 3600_000 + (Date.now() % (12 * 3600_000));
    const startA = new Date(Date.now() + offsetMs);
    const endA = new Date(startA.getTime() + 45 * 60_000);

    const createSch = await request.post(`${API}/schedule`, {
      headers,
      data: {
        unitId: UNIT_ID,
        title: `G8 Smoke ${Date.now()}`,
        type: 'class',
        startAt: startA.toISOString(),
        endAt: endA.toISOString(),
        teacherId: profileId || undefined,
        maxCapacity: 1,
      },
    });
    expect([200, 201]).toContain(createSch.status());
    const schedule = await createSch.json();
    expect(schedule).toHaveProperty('id');

    // Teacher conflict 409
    if (profileId) {
      const conflict = await request.post(`${API}/schedule`, {
        headers,
        data: {
          unitId: UNIT_ID,
          title: 'G8 Conflict',
          type: 'class',
          startAt: new Date(startA.getTime() + 15 * 60_000).toISOString(),
          endAt: new Date(endA.getTime() + 15 * 60_000).toISOString(),
          teacherId: profileId,
          maxCapacity: 10,
        },
      });
      expect(conflict.status()).toBe(409);
      const cBody = await conflict.json();
      expect(conflictCode(cBody) || JSON.stringify(cBody)).toMatch(/teacher_conflict/);
    }

    // Copy week
    const weekStart = new Date(startA);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);
    const targetWeek = new Date(weekStart);
    targetWeek.setDate(targetWeek.getDate() + 7);
    const copy = await request.post(`${API}/schedule/copy-week`, {
      headers,
      data: {
        sourceWeekStart: weekStart.toISOString(),
        targetWeekStart: targetWeek.toISOString(),
        unitId: UNIT_ID,
      },
    });
    expect([200, 201]).toContain(copy.status());
    const copyBody = await copy.json();
    expect(copyBody).toHaveProperty('created');

    // Enroll → waitlist when full → cancel promotes
    const e1 = await request.post(`${API}/classes/${schedule.id}/enroll`, {
      headers,
      data: { studentId },
    });
    expect([200, 201]).toContain(e1.status());
    const enroll1 = await e1.json();
    expect(enroll1.status).toBe('reserved');

    const students = await request.get(`${API}/alunos?limit=10`, { headers });
    const list = (await students.json()) as unknown;
    const arr = Array.isArray(list) ? list : (list as { items?: unknown[] }).items || [];
    const student2 = (arr as Array<{ id: string }>).find((s) => s.id !== studentId)?.id;

    if (student2) {
      const e2 = await request.post(`${API}/classes/${schedule.id}/enroll`, {
        headers,
        data: { studentId: student2 },
      });
      expect([200, 201]).toContain(e2.status());
      const enroll2 = await e2.json();
      expect(enroll2.status).toBe('waitlist');

      const cancel = await request.delete(
        `${API}/classes/${schedule.id}/enroll?studentId=${studentId}`,
        { headers },
      );
      expect(cancel.status()).toBe(200);

      const remaining = await request.get(`${API}/classes/${schedule.id}/enrollments`, {
        headers,
      });
      expect(remaining.status()).toBe(200);
      const ens = (await remaining.json()) as Array<{ studentId: string; status: string }>;
      const promoted = ens.find((e) => e.studentId === student2);
      expect(promoted?.status).toBe('reserved');
    }

    // Attendance batch (re-enroll first student if needed)
    let enrollments = (await (
      await request.get(`${API}/classes/${schedule.id}/enrollments`, { headers })
    ).json()) as Array<{ id: string; status: string }>;
    if (!enrollments.some((e) => e.status === 'reserved' || e.status === 'checked_in')) {
      await request.post(`${API}/classes/${schedule.id}/enroll`, {
        headers,
        data: { studentId },
      });
      enrollments = (await (
        await request.get(`${API}/classes/${schedule.id}/enrollments`, { headers })
      ).json()) as Array<{ id: string; status: string }>;
    }
    const target = enrollments.find((e) => e.status === 'reserved' || e.status === 'waitlist');
    if (target) {
      const att = await request.post(`${API}/classes/${schedule.id}/attendance`, {
        headers,
        data: { items: [{ enrollmentId: target.id, status: 'checked_in' }] },
      });
      expect([200, 201]).toContain(att.status());
      const attBody = await att.json();
      expect(attBody.updated).toBeGreaterThanOrEqual(1);
    }

    // Dashboard shape
    const dash = await request.get(`${API}/agenda/dashboard`, { headers });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('classesToday');
    expect(dashBody).toHaveProperty('occupancyPct');
    expect(dashBody).toHaveProperty('waitlistToday');

    const kpis = await request.get(`${API}/agenda/kpis`, { headers });
    expect(kpis.status()).toBe(200);
    const kpiBody = await kpis.json();
    expect(kpiBody).toHaveProperty('attendanceRate');
    expect(kpiBody).toHaveProperty('topModalities');

    // Teacher agenda
    const teacherAgenda = await request.get(`${API}/agenda/teacher`, { headers });
    expect(teacherAgenda.status()).toBe(200);
    expect(Array.isArray(await teacherAgenda.json())).toBe(true);

    // Modalities
    const mods = await request.get(`${API}/modalities`, { headers });
    expect(mods.status()).toBe(200);
    expect((await mods.json()).length).toBeGreaterThanOrEqual(1);

    // Complete class → partner stub
    const complete = await request.post(`${API}/classes/${schedule.id}/complete`, { headers });
    expect([200, 201]).toContain(complete.status());
    const completeBody = await complete.json();
    expect(completeBody.partnerLog?.httpStatus || completeBody.partnerLog?.http_status).toBe(200);

    // Suggestions stub
    const sug = await request.get(`${API}/agenda/suggestions`, { headers });
    expect(sug.status()).toBe(200);
    expect(Array.isArray(await sug.json())).toBe(true);
  });

  test('portal agenda aluno + permissions', async ({ request }) => {
    test.setTimeout(60_000);
    const studentToken = await login(request, STUDENT_EMAIL, DEV_PASSWORD);
    test.skip(!studentToken, 'Student dev login unavailable');
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    const portal = await request.get(`${API}/portal/agenda`, { headers: studentHeaders });
    expect(portal.status()).toBe(200);
    const body = await portal.json();
    expect(body).toHaveProperty('student');
    expect(body).toHaveProperty('upcoming');
    expect(body).toHaveProperty('openClasses');

    // Student cannot create schedule
    const create = await request.post(`${API}/schedule`, {
      headers: studentHeaders,
      data: {
        unitId: UNIT_ID,
        title: 'Student blocked',
        type: 'class',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600_000).toISOString(),
      },
    });
    expect([401, 403]).toContain(create.status());

    const trainerToken = await login(request, TRAINER_EMAIL, DEV_PASSWORD);
    if (trainerToken) {
      const trainerHeaders = { Authorization: `Bearer ${trainerToken}` };
      const teacher = await request.get(`${API}/agenda/teacher`, { headers: trainerHeaders });
      expect(teacher.status()).toBe(200);
    }
  });
});
