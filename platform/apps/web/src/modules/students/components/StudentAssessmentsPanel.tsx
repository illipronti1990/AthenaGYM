'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Assessment, ProgressSummary } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function StudentAssessmentsPanel({
  accessToken,
  studentId,
  unitId,
}: {
  accessToken: string;
  studentId: string;
  unitId?: string;
}) {
  const { push } = useToast();
  const [items, setItems] = useState<Assessment[] | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('170');
  const [bodyFat, setBodyFat] = useState('25');
  const [sex, setSex] = useState<'female' | 'male' | 'other'>('female');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [assessments, prog] = await Promise.all([
        workoutsApi.assessments(accessToken, studentId),
        workoutsApi.progress(accessToken, studentId).catch(() => null),
      ]);
      setItems(assessments);
      setProgress(prog);
      const last = assessments[0];
      if (last?.weight != null) setWeight(String(last.weight));
      if (last?.height != null) setHeight(String(last.height));
      if (last?.bodyFat != null) setBodyFat(String(last.bodyFat));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar avaliações', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await workoutsApi.createAssessment(accessToken, {
        studentId,
        ...(unitId ? { unitId } : {}),
        weight: Number(weight),
        height: Number(height),
        bodyFat: Number(bodyFat),
        sex,
        objective: 'hipertrofia',
      });
      push('Avaliação salva');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao salvar avaliação', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!items) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6" data-testid="student-assessments-panel">
      {progress ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Δ peso</p>
            <p className="mt-1 text-xl font-semibold text-[var(--gold)]">
              {progress.weightDelta != null ? `${progress.weightDelta} kg` : '—'}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Δ gordura</p>
            <p className="mt-1 text-xl font-semibold text-[var(--gold)]">
              {progress.bodyFatDelta != null ? `${progress.bodyFatDelta}%` : '—'}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Evolução</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text)]">
              {progress.evolutionPct != null ? `${progress.evolutionPct}%` : '—'}
            </p>
          </Card>
        </div>
      ) : null}

      <Card>
        <h3 className="athena-title mb-3 text-lg">Nova avaliação</h3>
        <form
          onSubmit={onCreate}
          className="flex flex-wrap items-end gap-3"
          data-testid="student-assessment-form"
        >
          <label className="text-sm text-[var(--muted)]">
            Peso (kg)
            <input
              required
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="athena-input mt-1 block w-24"
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Altura (cm)
            <input
              required
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="athena-input mt-1 block w-24"
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            % Gordura
            <input
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="athena-input mt-1 block w-24"
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Sexo
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
              className="athena-input mt-1 block w-auto"
            >
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
              <option value="other">Outro</option>
            </select>
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar avaliação'}
          </Button>
        </form>
      </Card>

      <section>
        <h3 className="athena-title mb-3 text-lg">Histórico de avaliações</h3>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma avaliação registrada.</p>
        ) : (
          <ul className="athena-list" data-testid="student-assessments-list">
            {items.map((a) => (
              <li key={a.id} className="athena-list-item">
                <span>
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.weight ?? '—'} kg · IMC{' '}
                  {a.bmi ?? '—'} · BF {a.bodyFat ?? '—'}%
                  {a.leanMass != null ? ` · massa magra ${a.leanMass} kg` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
