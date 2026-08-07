import type {
  Assessment,
  CoachDashboard,
  Exercise,
  ProgressSummary,
  TrainingTimelineItem,
  Workout,
  WorkoutChangeLog,
  WorkoutTemplate,
  WorkoutsDashboard,
} from '@movvo/shared';

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
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const workoutsApi = {
  dashboard: (t: string) => apiFetch<WorkoutsDashboard>('/workouts/dashboard', t),
  coachDashboard: (t: string) => apiFetch<CoachDashboard>('/coach/dashboard', t),
  coachAgenda: (t: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const s = q.toString();
    return apiFetch(`/coach/agenda${s ? `?${s}` : ''}`, t);
  },
  workouts: (t: string, studentId?: string) =>
    apiFetch<Workout[]>(studentId ? `/workouts?studentId=${studentId}` : '/workouts', t),
  getWorkout: (t: string, id: string) => apiFetch<Workout>(`/workouts/${id}`, t),
  createWorkout: (t: string, body: Record<string, unknown>) =>
    apiFetch<Workout>('/workouts', t, { method: 'POST', body: JSON.stringify(body) }),
  updateWorkout: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Workout>(`/workouts/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  publishWorkout: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }),
  duplicateWorkout: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}/duplicate`, t, { method: 'POST', body: '{}' }),
  reorderExercises: (t: string, id: string, exerciseIds: string[]) =>
    apiFetch<Workout>(`/workouts/${id}/reorder`, t, {
      method: 'POST',
      body: JSON.stringify({ exerciseIds }),
    }),
  addWorkoutExercise: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Workout>(`/workouts/${id}/exercises`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patchWorkoutExercise: (t: string, id: string, exId: string, body: Record<string, unknown>) =>
    apiFetch<Workout>(`/workouts/${id}/exercises/${exId}`, t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeWorkoutExercise: (t: string, id: string, exId: string) =>
    apiFetch<Workout>(`/workouts/${id}/exercises/${exId}`, t, { method: 'DELETE' }),
  signWorkout: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}/sign`, t, { method: 'POST', body: '{}' }),
  signWorkoutStudent: (t: string, id: string) =>
    apiFetch<Workout>(`/workouts/${id}/sign-student`, t, { method: 'POST', body: '{}' }),
  workoutHistory: (t: string, id: string) =>
    apiFetch<WorkoutChangeLog[]>(`/workouts/${id}/history`, t),
  completeSession: (t: string, workoutId: string) =>
    apiFetch<{ sessionId: string }>('/workouts/sessions/complete', t, {
      method: 'POST',
      body: JSON.stringify({ workoutId }),
    }),
  exercises: (
    t: string,
    filters?: {
      muscleGroup?: string;
      equipment?: string;
      difficulty?: string;
      objective?: string;
      q?: string;
    },
  ) => {
    const q = new URLSearchParams();
    if (filters?.muscleGroup) q.set('muscleGroup', filters.muscleGroup);
    if (filters?.equipment) q.set('equipment', filters.equipment);
    if (filters?.difficulty) q.set('difficulty', filters.difficulty);
    if (filters?.objective) q.set('objective', filters.objective);
    if (filters?.q) q.set('q', filters.q);
    const s = q.toString();
    return apiFetch<Exercise[]>(`/exercises${s ? `?${s}` : ''}`, t);
  },
  createExercise: (t: string, body: Record<string, unknown>) =>
    apiFetch<Exercise>('/exercises', t, { method: 'POST', body: JSON.stringify(body) }),
  updateExercise: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Exercise>(`/exercises/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExercise: (t: string, id: string) =>
    apiFetch<{ ok: boolean }>(`/exercises/${id}`, t, { method: 'DELETE' }),
  templates: (t: string) => apiFetch<WorkoutTemplate[]>('/templates', t),
  getTemplate: (t: string, id: string) => apiFetch<WorkoutTemplate>(`/templates/${id}`, t),
  applyTemplate: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Workout>(`/templates/${id}/apply`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  duplicateTemplate: (t: string, id: string) =>
    apiFetch<WorkoutTemplate>(`/templates/${id}/duplicate`, t, { method: 'POST', body: '{}' }),
  assessments: (t: string, studentId?: string) =>
    apiFetch<Assessment[]>(
      studentId ? `/assessments?studentId=${studentId}` : '/assessments',
      t,
    ),
  createAssessment: (t: string, body: Record<string, unknown>) =>
    apiFetch<Assessment>('/assessments', t, { method: 'POST', body: JSON.stringify(body) }),
  updateAssessment: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Assessment>(`/assessments/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteAssessment: (t: string, id: string) =>
    apiFetch<{ ok: boolean; id: string }>(`/assessments/${id}`, t, { method: 'DELETE' }),
  progress: (t: string, studentId: string, from?: string, to?: string) => {
    const q = new URLSearchParams({ studentId });
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return apiFetch<ProgressSummary>(`/progress?${q}`, t);
  },
  trainingTimeline: (t: string, studentId: string) =>
    apiFetch<TrainingTimelineItem[]>(`/students/${studentId}/training-timeline`, t),
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
  printWorkoutUrl: (id: string) => `${API_URL}/prints/workout/${id}`,
  printProgressUrl: (studentId: string) => `${API_URL}/prints/progress/${studentId}`,
  printAssessmentUrl: (id: string) => `${API_URL}/prints/assessment/${id}`,
};
