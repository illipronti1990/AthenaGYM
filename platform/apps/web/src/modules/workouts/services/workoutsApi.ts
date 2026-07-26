import type {
  Assessment,
  Exercise,
  ProgressSummary,
  Workout,
  WorkoutTemplate,
  WorkoutsDashboard,
} from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const workoutsApi = {
  dashboard: (t: string) => apiFetch<WorkoutsDashboard>('/workouts/dashboard', t),
  workouts: (t: string, studentId?: string) =>
    apiFetch<Workout[]>(studentId ? `/workouts?studentId=${studentId}` : '/workouts', t),
  createWorkout: (t: string, body: Record<string, unknown>) =>
    apiFetch<Workout>('/workouts', t, { method: 'POST', body: JSON.stringify(body) }),
  publishWorkout: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }),
  duplicateWorkout: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}/duplicate`, t, { method: 'POST', body: '{}' }),
  completeSession: (t: string, workoutId: string) =>
    apiFetch<{ sessionId: string }>('/workouts/sessions/complete', t, {
      method: 'POST',
      body: JSON.stringify({ workoutId }),
    }),
  exercises: (t: string) => apiFetch<Exercise[]>('/exercises', t),
  createExercise: (t: string, body: Record<string, unknown>) =>
    apiFetch<Exercise>('/exercises', t, { method: 'POST', body: JSON.stringify(body) }),
  templates: (t: string) => apiFetch<WorkoutTemplate[]>('/templates', t),
  assessments: (t: string, studentId?: string) =>
    apiFetch<Assessment[]>(
      studentId ? `/assessments?studentId=${studentId}` : '/assessments',
      t,
    ),
  createAssessment: (t: string, body: Record<string, unknown>) =>
    apiFetch<Assessment>('/assessments', t, { method: 'POST', body: JSON.stringify(body) }),
  deleteAssessment: (t: string, id: string) =>
    apiFetch<{ ok: boolean; id: string }>(`/assessments/${id}`, t, { method: 'DELETE' }),
  progress: (t: string, studentId: string) =>
    apiFetch<ProgressSummary>(`/progress?studentId=${studentId}`, t),
  createPhoto: (t: string, body: Record<string, unknown>) =>
    apiFetch('/progress/photos', t, { method: 'POST', body: JSON.stringify(body) }),
  uploadPhoto: async (
    t: string,
    body: { studentId: string; type?: string; file: File },
  ) => {
    const form = new FormData();
    form.append('file', body.file);
    form.append('studentId', body.studentId);
    if (body.type) form.append('type', body.type);
    const res = await fetch(`${API_URL}/progress/photos/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: form,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`/progress/photos/upload failed (${res.status}): ${await res.text()}`);
    return res.json();
  },
  deletePhoto: (t: string, id: string) =>
    apiFetch<{ ok: boolean; id: string }>(`/progress/photos/${id}`, t, {
      method: 'DELETE',
    }),
  aiSuggest: (t: string, body: Record<string, unknown>) =>
    apiFetch<{ suggestionId: string; draft: Workout | null }>('/ai/workout-suggestions', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
