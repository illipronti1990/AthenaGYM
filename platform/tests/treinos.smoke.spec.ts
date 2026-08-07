import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = process.env.ATHENA_E2E_EMAIL || 'teste@athena.local';
const DEV_PASSWORD = process.env.ATHENA_E2E_PASSWORD || 'teste123';

async function login(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API}/auth/dev-login`, {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
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

test.describe('Treinos G-7 smoke', () => {
  test('exercises without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/exercises`);
    expect(res.status()).toBe(401);
  });

  test('treinos hub redirects unauthenticated toward login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/treinos`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('legacy /app/workouts redirects toward treinos when unauthenticated', async ({
    request,
  }) => {
    const res = await request.get(`${WEB}/app/workouts`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    const loc = String(res.headers()['location'] || '');
    if (res.status() >= 300 && res.status() < 400) {
      expect(loc).toMatch(/login|treinos/);
    }
  });

  test('G-7 critical API flows', async ({ request }) => {
    test.setTimeout(120_000);
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');
    const headers = { Authorization: `Bearer ${token}` };

    const studentId = await firstStudentId(request, headers);
    test.skip(!studentId, 'No students seeded');

    // CRUD exercise + filters
    const createEx = await request.post(`${API}/exercises`, {
      headers,
      data: {
        name: `G7 Smoke ${Date.now()}`,
        muscleGroup: 'peito',
        categories: ['peito'],
        difficulty: 'beginner',
        objective: 'hipertrofia',
      },
    });
    expect([200, 201]).toContain(createEx.status());
    const exercise = await createEx.json();
    expect(exercise).toHaveProperty('id');

    const filtered = await request.get(`${API}/exercises?muscleGroup=peito&q=G7`, { headers });
    expect(filtered.status()).toBe(200);
    expect(Array.isArray(await filtered.json())).toBe(true);

    // Create workout with 2 exercises (RPE) + duplicate
    const exList = await request.get(`${API}/exercises`, { headers });
    const exercises = (await exList.json()) as Array<{ id: string }>;
    const a = exercises[0]?.id;
    const b = exercises[1]?.id || exercises[0]?.id;
    expect(a).toBeTruthy();

    const createWo = await request.post(`${API}/workouts`, {
      headers,
      data: {
        studentId,
        name: `G7 Treino ${Date.now()}`,
        splitType: 'ABC',
        publish: true,
        exercises: [
          {
            exerciseId: a,
            sortOrder: 1,
            sets: 3,
            repetitions: '10',
            rpe: 7,
            dayLabel: 'A',
            load: '40kg',
          },
          {
            exerciseId: b,
            sortOrder: 2,
            sets: 4,
            repetitions: '8',
            rpe: 8,
            dayLabel: 'B',
            load: '50kg',
          },
        ],
      },
    });
    expect([200, 201]).toContain(createWo.status());
    const workout = await createWo.json();
    expect(workout.id).toBeTruthy();
    expect(workout.exercises?.length).toBeGreaterThanOrEqual(1);

    const dup = await request.post(`${API}/workouts/${workout.id}/duplicate`, {
      headers,
      data: {},
    });
    expect([200, 201]).toContain(dup.status());

    // Alterar carga via PATCH exercício
    const firstExId = workout.exercises?.[0]?.id;
    if (firstExId) {
      const patchEx = await request.patch(
        `${API}/workouts/${workout.id}/exercises/${firstExId}`,
        { headers, data: { load: '45kg', rpe: 7.5 } },
      );
      expect(patchEx.status()).toBe(200);
      const patched = await patchEx.json();
      const row = (patched.exercises || []).find((e: { id: string }) => e.id === firstExId);
      expect(row?.load).toBe('45kg');
    }

    // Avaliação completa + progress series
    const assess = await request.post(`${API}/assessments`, {
      headers,
      data: {
        studentId,
        weight: 78,
        height: 175,
        bodyFat: 16,
        hrRest: 58,
        bpSystolic: 118,
        bpDiastolic: 76,
        goal: 'hipertrofia',
        ageYears: 28,
        sex: 'male',
        nextDueAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        skinfoldsJson: { triceps: 10 },
        measurements: { waist: 82, chest: 102, neck: 38 },
      },
    });
    expect([200, 201]).toContain(assess.status());
    const assessment = await assess.json();
    expect(assessment.bmi).toBeTruthy();

    const progress = await request.get(`${API}/progress?studentId=${studentId}`, { headers });
    expect(progress.status()).toBe(200);
    const progBody = await progress.json();
    expect(progBody).toHaveProperty('series');
    expect(progBody).toHaveProperty('comparisons');

    // Upload photo front (metadata path — storage may be optional)
    const photo = await request.post(`${API}/progress/photos`, {
      headers,
      data: {
        studentId,
        type: 'front',
        storagePath: `smoke-front-${Date.now()}.jpg`,
      },
    });
    expect([200, 201, 400]).toContain(photo.status());

    // PDFs
    const pdfWo = await request.get(`${API}/prints/workout/${workout.id}`, { headers });
    expect(pdfWo.status()).toBe(200);
    expect(pdfWo.headers()['content-type'] || '').toMatch(/pdf/);

    const pdfAs = await request.get(`${API}/prints/assessment/${assessment.id}`, { headers });
    expect(pdfAs.status()).toBe(200);

    const pdfPr = await request.get(`${API}/prints/progress/${studentId}`, { headers });
    expect(pdfPr.status()).toBe(200);

    // Coach dashboard shape
    const coach = await request.get(`${API}/coach/dashboard`, { headers });
    expect(coach.status()).toBe(200);
    const coachBody = await coach.json();
    expect(coachBody).toHaveProperty('activeStudents');
    expect(coachBody).toHaveProperty('pendingAssessments');
    expect(coachBody).toHaveProperty('agendaToday');

    // Sign trainer stub
    const sign = await request.post(`${API}/workouts/${workout.id}/sign`, {
      headers,
      data: {},
    });
    expect([200, 201]).toContain(sign.status());
    const signed = await sign.json();
    expect(signed.signedTrainerAt).toBeTruthy();

    // Timeline após publish
    const timeline = await request.get(`${API}/students/${studentId}/training-timeline`, {
      headers,
    });
    expect(timeline.status()).toBe(200);
    const tl = await timeline.json();
    expect(Array.isArray(tl)).toBe(true);
    expect(tl.length).toBeGreaterThan(0);

    // Reception without create (403) — only if we can mint reception token
    const receptionLogin = await request.post(`${API}/auth/dev-login`, {
      data: { email: 'recepcao@athena.local', password: DEV_PASSWORD },
    });
    if (receptionLogin.ok()) {
      const rBody = (await receptionLogin.json()) as {
        accessToken?: string;
        access_token?: string;
      };
      const rToken = rBody.accessToken || rBody.access_token;
      if (rToken) {
        const denied = await request.post(`${API}/workouts`, {
          headers: { Authorization: `Bearer ${rToken}` },
          data: {
            studentId,
            name: 'Should fail',
            exercises: [{ exerciseId: a, sortOrder: 1 }],
          },
        });
        expect([401, 403]).toContain(denied.status());
      }
    }
  });
});
