'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Contract, Enrollment, Lead, Plan } from '@athena/shared';
import { Button } from '@athena/ui';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function EnrollmentsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Enrollment[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [studentId, setStudentId] = useState('');
  const [planId, setPlanId] = useState('');

  async function load() {
    try {
      const [e, p] = await Promise.all([
        salesApi.enrollments(accessToken),
        salesApi.plans(accessToken),
      ]);
      setItems(e);
      setPlans(p);
      if (!planId && p[0]) setPlanId(p[0].id);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await salesApi.createEnrollment(accessToken, { studentId, planId });
      push('Matrícula criada');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <AlunoSelect
          accessToken={accessToken}
          value={studentId}
          onChange={setStudentId}
          className="athena-input min-w-[280px]"
        />
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="athena-input w-auto"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button type="submit">Matricular</Button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="athena-list">
          {items.map((i) => (
            <li key={i.id} className="athena-list-item">
              {i.id.slice(0, 8)}… · aluno {i.studentId.slice(0, 8)}… · plano {i.planId.slice(0, 8)}… ·{' '}
              {i.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ContractsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Contract[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [planId, setPlanId] = useState('');
  const [leadId, setLeadId] = useState('');

  async function load() {
    try {
      const [c, p, l] = await Promise.all([
        salesApi.contracts(accessToken),
        salesApi.plans(accessToken),
        salesApi.leads(accessToken),
      ]);
      setItems(c);
      setPlans(p);
      setLeads(l);
      if (!planId && p[0]) setPlanId(p[0].id);
      if (!leadId && l[0]) setLeadId(l[0].id);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await salesApi.createContract(accessToken, {
        planId,
        leadId: leadId || undefined,
      });
      push('Contrato gerado (draft)');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  async function onSign(id: string) {
    try {
      await salesApi.signContract(accessToken, id);
      push('Contrato assinado — aluno/matrícula gerados');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao assinar', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap gap-2">
        <select
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          className="athena-input w-auto"
        >
          <option value="">Lead (opcional se já houver aluno)</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.fullName}
            </option>
          ))}
        </select>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="athena-input w-auto"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button type="submit">Gerar contrato</Button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="athena-list">
          {items.map((c) => (
            <li key={c.id} className="athena-list-item flex-wrap">
              <span>
                {c.contractNumber} · {c.status}
                {c.signedAt ? ` · ${new Date(c.signedAt).toLocaleString('pt-BR')}` : ''}
              </span>
              {c.status !== 'signed' ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-3 !py-1 text-xs"
                  onClick={() => void onSign(c.id)}
                >
                  Assinar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
