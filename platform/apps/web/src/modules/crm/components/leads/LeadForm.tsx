'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Lead, LeadSource } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { salesApi } from '@/modules/sales/services/salesApi';
import { crmApi } from '../../services/crmApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function LeadForm({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [interest, setInterest] = useState('');
  const [goal, setGoal] = useState('');
  const [firstContactAt, setFirstContactAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  async function load() {
    try {
      const [l, s] = await Promise.all([salesApi.leads(accessToken), salesApi.sources(accessToken)]);
      setLeads(l);
      setSources(s);
      if (!sourceId && s[0]) setSourceId(s[0].id);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao listar leads', 'error');
      setLeads([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await salesApi.createLead(accessToken, {
        fullName,
        phone,
        email,
        sourceId: sourceId || undefined,
        interest: interest || undefined,
        goal: goal || undefined,
        firstContactAt: firstContactAt || undefined,
        whatsapp: phone || undefined,
      });
      push('Lead criado com sucesso');
      setFullName('');
      setPhone('');
      setEmail('');
      setInterest('');
      setGoal('');
      setFirstContactAt('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao criar lead', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function onConvert(id: string) {
    setConvertingId(id);
    try {
      const result = await crmApi.convertLead(accessToken, id);
      push(`Lead convertido — aluno #${result.studentId.slice(0, 8)}`);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao converter lead', 'error');
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={onCreate} className="grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="movvo-input"
            data-testid="lead-name"
          />
          <input
            placeholder="Telefone / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="movvo-input"
          />
          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="movvo-input"
          />
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="movvo-input"
          >
            <option value="">Origem</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Interesse / objetivo"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="movvo-input"
          />
          <input
            placeholder="Meta (ex: emagrecer, hipertrofia)"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="movvo-input"
          />
          <div className="sm:col-span-2">
            <label className="text-xs text-[var(--muted)]">
              Primeiro contato
              <input
                type="date"
                value={firstContactAt}
                onChange={(e) => setFirstContactAt(e.target.value)}
                className="movvo-input mt-1 block w-full"
              />
            </label>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Salvando…' : 'Novo lead'}
            </Button>
          </div>
        </form>
      </Card>

      {!leads ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="movvo-table" data-testid="leads-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Objetivo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.fullName}</td>
                  <td>{l.phone || l.whatsapp || l.email || '—'}</td>
                  <td>{l.interest || '—'}</td>
                  <td>{l.status}</td>
                  <td>
                    {l.status !== 'converted' && (
                      <button
                        type="button"
                        disabled={convertingId === l.id}
                        onClick={() => void onConvert(l.id)}
                        className="movvo-link text-[var(--gold)] disabled:opacity-50"
                      >
                        {convertingId === l.id ? 'Convertendo…' : 'Converter'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
