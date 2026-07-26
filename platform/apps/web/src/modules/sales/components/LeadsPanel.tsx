'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Lead, LeadSource } from '@athena/shared';
import { Button, Card } from '@athena/ui';
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
      <Card>
        <form onSubmit={onCreate} className="grid gap-2 sm:grid-cols-3">
          <input
            required
            placeholder="Nome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="athena-input"
            data-testid="lead-name"
          />
          <input
            placeholder="Telefone / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="athena-input"
          />
          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="athena-input"
          />
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="athena-input"
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
            className="athena-input"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Novo lead'}
          </Button>
        </form>
      </Card>

      {!leads ? (
        <TableSkeleton />
      ) : (
        <div className="athena-list overflow-x-auto">
          <table className="athena-table" data-testid="leads-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.fullName}</td>
                  <td>{l.phone || l.whatsapp || '—'}</td>
                  <td>{l.email || '—'}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
