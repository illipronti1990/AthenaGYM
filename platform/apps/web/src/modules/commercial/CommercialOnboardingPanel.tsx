'use client';

import { useEffect, useState } from 'react';
import { marketingApi } from '@/modules/marketing/services/marketingApi';

const STAGES = [
  { id: 'cadastro', label: 'Cadastro' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'config', label: 'Configuração inicial' },
  { id: 'import', label: 'Importação de dados' },
  { id: 'treinamento', label: 'Treinamento' },
  { id: 'go_live', label: 'Go-live' },
] as const;

const DEFAULT_CHECKLIST = {
  contrato_assinado: false,
  unidade_criada: false,
  usuarios_convidados: false,
  planos_configurados: false,
  alunos_importados: false,
  treinamento_ok: false,
  go_live: false,
};

export function CommercialOnboardingPanel({ accessToken }: { accessToken: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [academyName, setAcademyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await marketingApi.listOnboarding(accessToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  async function create() {
    if (!academyName.trim()) return;
    await marketingApi.upsertOnboarding(accessToken, {
      academyName: academyName.trim(),
      stage: 'cadastro',
      checklist: DEFAULT_CHECKLIST,
    });
    setAcademyName('');
    await load();
  }

  async function advance(row: Record<string, unknown>, stage: string) {
    await marketingApi.upsertOnboarding(accessToken, {
      id: String(row.id),
      academyName: String(row.academy_name || ''),
      stage,
      checklist: (row.checklist as Record<string, boolean>) || DEFAULT_CHECKLIST,
    });
    await load();
  }

  return (
    <div className="space-y-4" data-testid="commercial-onboarding">
      {error ? <p className="text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <input
          className="movvo-input flex-1"
          placeholder="Nome da academia"
          value={academyName}
          onChange={(e) => setAcademyName(e.target.value)}
        />
        <button type="button" className="movvo-btn movvo-btn-primary" onClick={() => void create()}>
          Novo onboarding
        </button>
      </div>
      <ol className="text-sm text-[var(--muted)] list-decimal pl-5 space-y-1">
        {STAGES.map((s) => (
          <li key={s.id}>{s.label}</li>
        ))}
      </ol>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={String(row.id)} className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex justify-between gap-2 flex-wrap">
              <strong>{String(row.academy_name || '—')}</strong>
              <span className="text-sm text-[var(--muted)]">Etapa: {String(row.stage)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="movvo-btn movvo-btn-secondary text-xs"
                  onClick={() => void advance(row, s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
