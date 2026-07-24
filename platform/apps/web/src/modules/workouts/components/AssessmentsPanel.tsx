'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Assessment, ProgressSummary } from '@athenas/shared';
import { workoutsApi } from '../services/workoutsApi';

export function AssessmentsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Assessment[]>([]);
  const [studentId, setStudentId] = useState('');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('175');
  const [bodyFat, setBodyFat] = useState('18');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    setItems(await workoutsApi.assessments(accessToken, studentId || undefined));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const a = await workoutsApi.createAssessment(accessToken, {
        studentId,
        weight: Number(weight),
        height: Number(height),
        bodyFat: Number(bodyFat),
        ageYears: 30,
        sex: 'male',
        objective: 'hipertrofia',
        measurements: { waist: 80, chest: 100 },
      });
      setMsg(`Avaliação ${a.id} · BMI ${a.bmi}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Student ID
          <input
            className="mt-1 block w-72 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Peso
          <input
            className="mt-1 block w-20 rounded border border-zinc-300 px-2 py-1.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Altura
          <input
            className="mt-1 block w-20 rounded border border-zinc-300 px-2 py-1.5"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </label>
        <label className="text-sm">
          % Gordura
          <input
            className="mt-1 block w-20 rounded border border-zinc-300 px-2 py-1.5"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </label>
        <button type="submit" className="rounded bg-[#A3001B] px-3 py-1.5 text-sm font-semibold text-white">
          Salvar avaliação
        </button>
      </form>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 text-sm">
        {items.map((a) => (
          <li key={a.id} className="py-2">
            {new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.weight}kg · BMI {a.bmi} · BF{' '}
            {a.bodyFat}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvolutionPanel({ accessToken }: { accessToken: string }) {
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('front.jpg');

  async function load() {
    setError(null);
    try {
      setData(await workoutsApi.progress(accessToken, studentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function addPhoto() {
    try {
      await workoutsApi.createPhoto(accessToken, {
        studentId,
        type: 'front',
        storagePath: photoName,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Student ID
          <input
            className="mt-1 block w-72 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!studentId}
          onClick={load}
          className="rounded bg-[#A3001B] px-3 py-1.5 text-sm font-semibold text-white"
        >
          Carregar evolução
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {data ? (
        <div className="space-y-3 text-sm">
          <p>
            Δ peso: {data.weightDelta ?? '—'} · Δ BF: {data.bodyFatDelta ?? '—'} · Evolução:{' '}
            {data.evolutionPct != null ? `${data.evolutionPct}%` : '—'}
          </p>
          <p>{data.assessments.length} avaliações · {data.photos.length} fotos</p>
          <div className="flex gap-2">
            <input
              className="rounded border border-zinc-300 px-2 py-1.5"
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
            />
            <button type="button" onClick={addPhoto} className="rounded border px-2 py-1">
              Registrar foto
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
