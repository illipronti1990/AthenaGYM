'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProgressSummary, Workout } from '@movvo/shared';
import { MinhaEvolucao } from '@/modules/treinos/evolucao/MinhaEvolucao';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type PortalMe = {
  student: {
    id: string;
    fullName: string;
    email: string | null;
    registrationNumber: string;
    status: string;
    planName: string | null;
  };
  progress: ProgressSummary;
  workouts: Workout[];
};

async function fetchPortalMe(token: string): Promise<PortalMe> {
  const res = await fetch(`${API_URL}/portal/me`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<PortalMe>;
}

export function PortalHome({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<PortalMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalMe(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando seu portal…</p>;

  return (
    <div className="space-y-6" data-testid="student-portal">
      <div className="rounded border border-[var(--border)] p-4">
        <h2 className="text-xl font-semibold">{data.student.fullName}</h2>
        <p className="text-sm text-[var(--muted)]">
          Matrícula {data.student.registrationNumber} · {data.student.planName || 'Sem plano'} ·{' '}
          {data.student.status}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/app/portal/treinos" className="movvo-chip-nav">
            Meus treinos
          </Link>
          <Link href="/app/portal/evolucao" className="movvo-chip-nav">
            Minha evolução
          </Link>
          <Link href="/app/profile" className="movvo-chip-nav">
            Meu perfil
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Treino ativo</div>
          <div className="font-medium">{data.progress.activeWorkout?.name || 'Nenhum'}</div>
        </div>
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Próxima avaliação</div>
          <div className="font-medium">{data.progress.nextAssessmentDue || '—'}</div>
        </div>
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Último check-in</div>
          <div className="font-medium">
            {data.progress.lastCheckinAt
              ? new Date(data.progress.lastCheckinAt).toLocaleString('pt-BR')
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortalTreinos({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<PortalMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalMe(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <div className="space-y-4" data-testid="portal-treinos">
      <ul className="divide-y divide-[var(--border)] text-sm">
        {data.workouts.length ? (
          data.workouts.map((w) => (
            <li key={w.id} className="flex justify-between py-3">
              <span>
                <strong>{w.name}</strong> · {w.status}
                {w.splitType ? ` · ${w.splitType}` : ''}
              </span>
              <span className="text-[var(--muted)]">
                {w.signedTrainerAt ? 'Assinado' : 'Pendente assinatura'}
              </span>
            </li>
          ))
        ) : (
          <li className="py-3 text-[var(--muted)]">Nenhum treino disponível</li>
        )}
      </ul>
    </div>
  );
}

export function PortalEvolucao({ accessToken }: { accessToken: string }) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalMe(accessToken)
      .then((d) => setStudentId(d.student.id))
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!studentId) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;
  return <MinhaEvolucao accessToken={accessToken} studentId={studentId} />;
}
