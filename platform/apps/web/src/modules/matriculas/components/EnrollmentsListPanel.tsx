'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Enrollment, RenewalDueItem } from '@movvo/shared';
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from '@movvo/shared';
import { Button, formatCurrencyBRL } from '@movvo/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';
import { RenewalAlert } from './RenewalAlert';

export function EnrollmentsListPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Enrollment[]>([]);
  const [renewals, setRenewals] = useState<RenewalDueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [list, due] = await Promise.all([
          matriculasApi.enrollments(accessToken),
          matriculasApi.renewalsDue(accessToken),
        ]);
        setItems(list);
        setRenewals(due);
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha ao listar matrículas', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, push]);

  return (
    <div className="space-y-4" data-testid="enrollments-list">
      <RenewalAlert items={renewals} />

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Carregando…</p>
      ) : (
        <div className="overflow-auto rounded-2xl border border-[var(--border)]">
          <table className="movvo-dg-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Início</th>
                <th>Vencimento</th>
                <th>Mensalidade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td>{e.studentName || e.studentId.slice(0, 8)}</td>
                  <td>{e.planName || e.planId.slice(0, 8)}</td>
                  <td>
                    {ENROLLMENT_STATUS_LABELS[e.status as EnrollmentStatus] || e.status}
                    {e.daysUntilExpiry != null && e.daysUntilExpiry <= 7 && e.status === 'active' ? (
                      <span className="ml-2 text-xs text-[var(--warn)]">
                        {e.daysUntilExpiry}d
                      </span>
                    ) : null}
                  </td>
                  <td>{e.startDate}</td>
                  <td>{e.endDate || '—'}</td>
                  <td>{e.monthlyFee != null ? formatCurrencyBRL(e.monthlyFee) : '—'}</td>
                  <td className="text-right">
                    <Link href={`/app/matriculas/${e.id}`}>
                      <Button size="sm" variant="secondary">
                        Abrir
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--muted)]">
                    Nenhuma matrícula ainda.{' '}
                    <Link href="/app/matriculas/nova" className="movvo-link text-[var(--gold)]">
                      Criar agora
                    </Link>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
