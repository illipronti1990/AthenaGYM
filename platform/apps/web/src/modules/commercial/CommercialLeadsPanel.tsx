'use client';

import { useCallback, useEffect, useState } from 'react';
import { marketingApi } from '@/modules/marketing/services/marketingApi';

const STATUSES = [
  { id: 'new', label: 'Novo' },
  { id: 'contacted', label: 'Contatado' },
  { id: 'demo_scheduled', label: 'Demonstração agendada' },
  { id: 'proposal_sent', label: 'Proposta enviada' },
  { id: 'negotiation', label: 'Negociação' },
  { id: 'won', label: 'Cliente' },
  { id: 'lost', label: 'Perdido' },
] as const;

export function CommercialLeadsPanel({ accessToken }: { accessToken: string }) {
  const [leads, setLeads] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await marketingApi.listLeads(accessToken, filter || undefined);
      setLeads(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar');
    }
  }, [accessToken, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setBusy(true);
    try {
      await marketingApi.updateLead(accessToken, id, { status, notes });
      await load();
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao atualizar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="commercial-leads">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="athena-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          data-testid="commercial-status-filter"
        >
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button type="button" className="athena-btn athena-btn-secondary" onClick={() => void load()}>
          Atualizar
        </button>
      </div>
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Academia</th>
              <th className="p-3">Contato</th>
              <th className="p-3">Alunos</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Status</th>
              <th className="p-3">UTM</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={String(lead.id)}
                className="border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]"
                onClick={() => {
                  setSelected(lead);
                  setNotes(String(lead.notes || ''));
                }}
              >
                <td className="p-3">{String(lead.academy_name)}</td>
                <td className="p-3">
                  <div>{String(lead.full_name)}</div>
                  <div className="text-[var(--muted)] text-xs">{String(lead.email)}</div>
                </td>
                <td className="p-3">{String(lead.student_count)}</td>
                <td className="p-3">{String(lead.plan_interest || '—')}</td>
                <td className="p-3">{String(lead.status)}</td>
                <td className="p-3">{String(lead.utm_source || 'direct')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" data-testid="commercial-lead-detail">
          <h2 className="athena-title text-xl">{String(selected.academy_name)}</h2>
          <p className="text-sm text-[var(--muted)]">
            {String(selected.full_name)} · {String(selected.city)}
            {selected.state ? `/${String(selected.state)}` : ''} · {String(selected.whatsapp || selected.phone)}
          </p>
          <label className="block text-sm">
            Notas internas
            <textarea
              className="athena-input mt-1 w-full"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                className="athena-btn athena-btn-secondary text-xs"
                onClick={() => void updateStatus(String(selected.id), s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
