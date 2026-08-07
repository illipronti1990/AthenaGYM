'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Enrollment, EnrollmentEvent } from '@athena/shared';
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from '@athena/shared';
import { Button, formatCurrencyBRL } from '@athena/ui';
import { matriculasApi } from '../services/matriculasApi';
import { EnrollmentTimeline } from './EnrollmentTimeline';
import { useToast } from '@/components/ui/Toast';

export function EnrollmentDetailPanel({
  accessToken,
  enrollmentId,
}: {
  accessToken: string;
  enrollmentId: string;
}) {
  const { push } = useToast();
  const [data, setData] = useState<(Enrollment & { events?: EnrollmentEvent[] }) | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setData(await matriculasApi.getEnrollment(accessToken, enrollmentId));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, enrollmentId]);

  async function unfreeze() {
    setBusy(true);
    try {
      await matriculasApi.unfreeze(accessToken, enrollmentId);
      push('Matrícula descongelada');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <div className="space-y-6" data-testid="enrollment-detail">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="athena-title text-2xl">{data.studentName || 'Aluno'}</h2>
            <p className="text-sm text-[var(--muted)]">{data.planName}</p>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-sm">
            {ENROLLMENT_STATUS_LABELS[data.status as EnrollmentStatus] || data.status}
          </span>
        </div>
        <dl className="grid gap-2 text-sm md:grid-cols-3">
          <div>
            <dt className="text-[var(--muted)]">Início</dt>
            <dd>{data.startDate}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Vencimento</dt>
            <dd>{data.endDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Mensalidade</dt>
            <dd>{data.monthlyFee != null ? formatCurrencyBRL(data.monthlyFee) : '—'}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/app/matriculas/${enrollmentId}/renovar`}>
            <Button size="sm">Renovar</Button>
          </Link>
          {data.status === 'active' ? (
            <Link href={`/app/matriculas/${enrollmentId}/congelar`}>
              <Button size="sm" variant="secondary">
                Congelar
              </Button>
            </Link>
          ) : null}
          {data.status === 'frozen' ? (
            <Button size="sm" variant="secondary" loading={busy} onClick={() => void unfreeze()}>
              Descongelar
            </Button>
          ) : null}
          <Link href={`/app/matriculas/${enrollmentId}/trocar-plano`}>
            <Button size="sm" variant="secondary">
              Trocar plano
            </Button>
          </Link>
          {data.status !== 'cancelled' ? (
            <Link href={`/app/matriculas/${enrollmentId}/cancelar`}>
              <Button size="sm" variant="danger">
                Cancelar
              </Button>
            </Link>
          ) : null}
          <Link href={`/app/alunos/${data.studentId}`}>
            <Button size="sm" variant="secondary">
              Perfil do aluno
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="athena-title mb-3 text-lg">Histórico</h3>
        <EnrollmentTimeline events={data.events || []} />
      </div>
    </div>
  );
}
