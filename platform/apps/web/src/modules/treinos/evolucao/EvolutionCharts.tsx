'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProgressSummary } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';

export function EvolutionCharts({
  accessToken,
  fixedStudentId,
}: {
  accessToken: string;
  fixedStudentId?: string;
}) {
  const [studentId, setStudentId] = useState(fixedStudentId || '');
  const [range, setRange] = useState<'30' | '90' | '180' | '365' | 'all'>('90');
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedStudentId) setStudentId(fixedStudentId);
  }, [fixedStudentId]);

  useEffect(() => {
    if (!studentId) return;
    const to = new Date();
    let from: string | undefined;
    if (range !== 'all') {
      const d = new Date();
      d.setDate(d.getDate() - Number(range));
      from = d.toISOString();
    }
    workoutsApi
      .progress(accessToken, studentId, from, to.toISOString())
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken, studentId, range]);

  const series = (data?.series || []).map((p) => ({
    date: new Date(p.date).toLocaleDateString('pt-BR'),
    weight: p.weight,
    bmi: p.bmi,
    leanMass: p.leanMass,
    bodyFat: p.bodyFat,
    fatMass: p.fatMass,
  }));

  return (
    <div className="space-y-4" data-testid="evolution-charts">
      {!fixedStudentId ? (
        <AlunoSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {(['30', '90', '180', '365', 'all'] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`movvo-chip-nav ${range === r ? 'movvo-chip-nav-active' : ''}`}
            onClick={() => setRange(r)}
          >
            {r === 'all' ? 'Tudo' : `${r}d`}
          </button>
        ))}
        {studentId ? (
          <a
            className="movvo-btn movvo-btn-ghost text-xs"
            href={workoutsApi.printProgressUrl(studentId)}
            target="_blank"
            rel="noreferrer"
          >
            PDF evolução
          </a>
        ) : null}
      </div>

      {data ? (
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>Δ peso: {data.weightDelta ?? '—'}</div>
          <div>Δ % gordura: {data.bodyFatDelta ?? '—'}</div>
          <div>Evolução %: {data.evolutionPct ?? '—'}</div>
          <div>Comparativo 30d: {data.comparisons?.['30d']?.weightDelta ?? '—'}</div>
          <div>Comparativo 90d: {data.comparisons?.['90d']?.weightDelta ?? '—'}</div>
          <div>Próx. avaliação: {data.nextAssessmentDue || '—'}</div>
        </div>
      ) : null}

      <div className="h-72 w-full">
        {series.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" name="Peso" stroke="#0f766e" dot={false} />
              <Line type="monotone" dataKey="bmi" name="IMC" stroke="#0369a1" dot={false} />
              <Line type="monotone" dataKey="bodyFat" name="% Gordura" stroke="#b45309" dot={false} />
              <Line type="monotone" dataKey="leanMass" name="Massa magra" stroke="#4d7c0f" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[var(--muted)]">Sem pontos de evolução.</p>
        )}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
