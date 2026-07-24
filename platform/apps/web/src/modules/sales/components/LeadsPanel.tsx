'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Lead, LeadSource } from '@athenas/shared';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function LeadsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [l, s] = await Promise.all([
        salesApi.leads(accessToken),
        salesApi.sources(accessToken),
      ]);
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
        whatsapp: phone || undefined,
      });
      push('Lead criado');
      setFullName('');
      setPhone('');
      setEmail('');
      setInterest('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="grid gap-2 rounded border border-zinc-200 bg-white p-4 sm:grid-cols-3">
        <input
          required
          placeholder="Nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          data-testid="lead-name"
        />
        <input
          placeholder="Telefone / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Interesse"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#A3001B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Salvando…' : 'Novo lead'}
        </button>
      </form>

      {!leads ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm" data-testid="leads-table">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Telefone</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{l.fullName}</td>
                  <td className="px-3 py-2">{l.phone || l.whatsapp || '—'}</td>
                  <td className="px-3 py-2">{l.email || '—'}</td>
                  <td className="px-3 py-2">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
