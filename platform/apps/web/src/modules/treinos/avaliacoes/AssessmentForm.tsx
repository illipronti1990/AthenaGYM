'use client';

import { FormEvent, useState } from 'react';
import type { Assessment } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';

export function AssessmentForm({ accessToken }: { accessToken: string }) {
  const [studentId, setStudentId] = useState('');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('175');
  const [bodyFat, setBodyFat] = useState('18');
  const [hrRest, setHrRest] = useState('60');
  const [bpSys, setBpSys] = useState('120');
  const [bpDia, setBpDia] = useState('80');
  const [goal, setGoal] = useState('hipertrofia');
  const [waist, setWaist] = useState('80');
  const [chest, setChest] = useState('100');
  const [nextDue, setNextDue] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Assessment | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!studentId) {
      setError('Selecione um aluno');
      return;
    }
    try {
      const a = await workoutsApi.createAssessment(accessToken, {
        studentId,
        weight: Number(weight),
        height: Number(height),
        bodyFat: Number(bodyFat),
        hrRest: Number(hrRest),
        bpSystolic: Number(bpSys),
        bpDiastolic: Number(bpDia),
        goal,
        objective: goal,
        nextDueAt: nextDue || undefined,
        ageYears: 30,
        sex: 'male',
        skinfoldsJson: { triceps: 12, abdomen: 20 },
        measurements: {
          waist: Number(waist),
          chest: Number(chest),
          neck: 38,
          hip: 95,
        },
      });
      setLast(a);
      setMsg(`Avaliação salva · IMC ${a.bmi} · massa gorda ${a.fatMass ?? '—'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onPhoto(file: File | null, type: string) {
    if (!file || !studentId) return;
    try {
      await workoutsApi.uploadPhoto(accessToken, { studentId, type, file });
      setMsg(`Foto ${type} enviada`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-6" data-testid="assessment-form">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <AlunoSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
        </div>
        {(
          [
            ['Peso (kg)', weight, setWeight],
            ['Altura (cm)', height, setHeight],
            ['% Gordura', bodyFat, setBodyFat],
            ['FC repouso', hrRest, setHrRest],
            ['PA sistólica', bpSys, setBpSys],
            ['PA diastólica', bpDia, setBpDia],
            ['Cintura', waist, setWaist],
            ['Peito', chest, setChest],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="text-sm text-[var(--muted)]">
            {label}
            <input
              className="mt-1 block movvo-input"
              value={val}
              onChange={(e) => set(e.target.value)}
            />
          </label>
        ))}
        <label className="text-sm text-[var(--muted)]">
          Meta
          <select className="mt-1 block movvo-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="hipertrofia">Hipertrofia</option>
            <option value="emagrecimento">Emagrecimento</option>
            <option value="condicionamento">Condicionamento</option>
            <option value="reabilitacao">Reabilitação</option>
          </select>
        </label>
        <label className="text-sm text-[var(--muted)]">
          Próxima avaliação
          <input
            type="date"
            className="mt-1 block movvo-input"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <button type="submit" className="movvo-btn movvo-btn-primary" data-testid="assessment-submit">
            Salvar avaliação
          </button>
        </div>
      </form>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Fotos (4 ângulos)</h3>
        <div className="flex flex-wrap gap-3">
          {(['front', 'back', 'left', 'right'] as const).map((type) => (
            <label key={type} className="text-sm text-[var(--muted)]">
              {type}
              <input
                type="file"
                accept="image/*"
                className="mt-1 block text-xs"
                onChange={(e) => onPhoto(e.target.files?.[0] || null, type)}
                data-testid={`photo-${type}`}
              />
            </label>
          ))}
        </div>
      </div>

      {last?.id ? (
        <a
          className="movvo-btn movvo-btn-ghost"
          href={workoutsApi.printAssessmentUrl(last.id)}
          target="_blank"
          rel="noreferrer"
        >
          PDF avaliação
        </a>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
    </div>
  );
}
