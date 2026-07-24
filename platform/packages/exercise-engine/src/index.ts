export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/** BMI = weight(kg) / height(m)^2 */
export function calcBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 100) / 100;
}

/** Mifflin-St Jeor BMR (defaults sex=male when unknown) */
export function calcBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: 'male' | 'female' = 'male',
): number | null {
  if (!weightKg || !heightCm || !ageYears) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const value = sex === 'female' ? base - 161 : base + 5;
  return Math.round(value * 100) / 100;
}

export function leanMassKg(weightKg: number, bodyFatPct: number | null | undefined): number | null {
  if (!weightKg || bodyFatPct == null) return null;
  return Math.round(weightKg * (1 - bodyFatPct / 100) * 100) / 100;
}

export function isWorkoutExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  d.setHours(23, 59, 59, 999);
  return now.getTime() > d.getTime();
}

export function storageExercisePath(companyId: string, kind: 'videos' | 'gifs' | 'images', fileName: string) {
  return `companies/${companyId}/exercises/${kind}/${fileName}`;
}

export function storageProgressPath(companyId: string, studentId: string, fileName: string) {
  return `companies/${companyId}/students/${studentId}/progress/${fileName}`;
}

export function storageAssessmentPath(companyId: string, studentId: string, fileName: string) {
  return `companies/${companyId}/students/${studentId}/assessments/${fileName}`;
}
