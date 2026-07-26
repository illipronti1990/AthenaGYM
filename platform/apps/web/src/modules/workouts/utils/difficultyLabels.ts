export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Fácil' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Difícil' },
] as const;

export type DifficultyValue = (typeof DIFFICULTY_OPTIONS)[number]['value'];

export function difficultyLabel(value: string | null | undefined): string {
  const found = DIFFICULTY_OPTIONS.find((o) => o.value === value);
  if (found) return found.label;
  if (!value) return '—';
  const lower = value.toLowerCase();
  if (lower === 'fácil' || lower === 'facil') return 'Fácil';
  if (lower === 'intermediário' || lower === 'intermediario') return 'Intermediário';
  if (lower === 'difícil' || lower === 'dificil' || lower === 'díficil') return 'Difícil';
  return value;
}
