/** PX-7 cache policies (staleTime) */
export const CACHE_TTL = {
  kpis: 30_000,
  alunos: 5 * 60_000,
  plans: 30 * 60_000,
  settings: 60 * 60_000,
  dashboard: 30_000,
  default: 15_000,
} as const;

export const queryKeys = {
  dashboard: (period: string) => ['executive-dashboard', period] as const,
  alunos: (params: Record<string, string | undefined>) => ['alunos', params] as const,
  plans: () => ['plans'] as const,
  settings: () => ['settings'] as const,
  kpis: () => ['kpis'] as const,
};
