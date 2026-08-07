'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { Assessment, ProgressSummary } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { workoutsApi } from '../services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ux/ConfirmProvider';

export function AssessmentsPanel({ accessToken }: { accessToken: string }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Assessment[]>([]);
  const [studentId, setStudentId] = useState('');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('175');
  const [bodyFat, setBodyFat] = useState('18');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reload(forStudentId = studentId) {
    setItems(await workoutsApi.assessments(accessToken, forStudentId || undefined));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!studentId) return;
    reload(studentId).catch((e) => setError(e instanceof Error ? e.message : 'erro'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function onCreate(e: FormEvent) {
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
        ageYears: 30,
        sex: 'male',
        objective: 'hipertrofia',
        measurements: { waist: 80, chest: 100 },
      });
      setMsg(`Avaliação salva · IMC ${a.bmi}`);
      await reload(studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onDelete(assessment: Assessment) {
    const ok = await confirm({
      title: 'Excluir esta avaliação física?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(assessment.id);
    setError(null);
    try {
      await workoutsApi.deleteAssessment(accessToken, assessment.id);
      setMsg('Avaliação excluída');
      await reload(studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <AlunoSelect
            accessToken={accessToken}
            value={studentId}
            onChange={setStudentId}
            className="athena-input mt-1 block w-72"
          />
          <label className="text-sm text-[var(--muted)]">
            Peso
            <input
              className="athena-input mt-1 block w-20"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Altura
            <input
              className="athena-input mt-1 block w-20"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            % Gordura
            <input
              className="athena-input mt-1 block w-20"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={!studentId}>
            Salvar avaliação
          </Button>
        </form>
      </Card>
      {msg ? <p className="text-sm text-[var(--gold)]">{msg}</p> : null}
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="athena-list text-sm" data-testid="assessments-list">
        {items.map((a) => (
          <li key={a.id} className="athena-list-item text-[var(--text)]">
            <span>
              {new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.weight}kg · IMC {a.bmi} · BF{' '}
              {a.bodyFat}%
            </span>
            <Button
              type="button"
              variant="secondary"
              className="border-[var(--primary)] text-[var(--primary-hover)] hover:bg-[var(--primary)] hover:text-white"
              disabled={deletingId === a.id}
              onClick={() => void onDelete(a)}
              data-testid={`delete-assessment-${a.id}`}
            >
              {deletingId === a.id ? 'Excluindo…' : 'Excluir'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvolutionPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<'front' | 'side' | 'back'>('front');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load(id = studentId) {
    if (!id) {
      push('Selecione um aluno', 'error');
      return;
    }
    setError(null);
    try {
      setData(await workoutsApi.progress(accessToken, id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'erro';
      setError(msg);
      push(msg, 'error');
    }
  }

  function onPickFile(selected: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!selected.type.startsWith('image/')) {
      push('Selecione uma imagem (jpg, png ou webp)', 'error');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      push('Imagem deve ter no máximo 5MB', 'error');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function addPhoto() {
    if (!studentId) {
      push('Selecione um aluno', 'error');
      return;
    }
    if (!file) {
      push('Selecione uma mídia para enviar', 'error');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await workoutsApi.uploadPhoto(accessToken, {
        studentId,
        type: photoType,
        file,
      });
      push('Foto enviada');
      onPickFile(null);
      await load(studentId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao enviar foto';
      setError(msg);
      push(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto(photoId: string) {
    const ok = await confirm({
      title: 'Apagar esta foto da evolução?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmLabel: 'Apagar',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(photoId);
    setError(null);
    try {
      await workoutsApi.deletePhoto(accessToken, photoId);
      push('Foto apagada');
      await load(studentId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao apagar foto';
      setError(msg);
      push(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <AlunoSelect
          accessToken={accessToken}
          value={studentId}
          onChange={(id) => {
            setStudentId(id);
            setData(null);
            onPickFile(null);
          }}
          required={false}
          className="athena-input mt-1 block w-72"
        />
        <Button type="button" disabled={!studentId} onClick={() => void load()}>
          Carregar evolução
        </Button>
      </div>
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      {studentId ? (
        <Card className="space-y-3 text-sm text-[var(--text)]">
          {data ? (
            <>
              <p>
                Δ peso: <span className="text-[var(--gold)]">{data.weightDelta ?? '—'}</span> · Δ BF:{' '}
                <span className="text-[var(--gold)]">{data.bodyFatDelta ?? '—'}</span> · Evolução:{' '}
                <span className="text-[var(--gold)]">
                  {data.evolutionPct != null ? `${data.evolutionPct}%` : '—'}
                </span>
              </p>
              <p className="text-[var(--muted)]">
                {data.assessments.length} avaliações · {data.photos.length} fotos
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Clique em “Carregar evolução” ou envie uma foto abaixo.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-[var(--muted)]">
              Tipo
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as typeof photoType)}
                className="athena-input mt-1 block w-auto"
              >
                <option value="front">Frente</option>
                <option value="side">Lateral</option>
                <option value="back">Costas</option>
              </select>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                onPickFile(e.target.files?.[0] || null);
                e.target.value = '';
              }}
              data-testid="progress-photo-input"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => fileInputRef.current?.click()}
              data-testid="select-photo"
            >
              Selecionar mídia
            </Button>
            <Button
              type="button"
              disabled={saving || !file}
              onClick={() => void addPhoto()}
              data-testid="register-photo"
            >
              {saving ? 'Enviando…' : 'Enviar foto'}
            </Button>
          </div>
          {preview ? (
            <div className="flex items-start gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Pré-visualização"
                className="h-28 w-28 rounded object-cover"
              />
              <div className="min-w-0 text-xs text-[var(--muted)]">
                <p className="truncate text-[var(--text)]">{file?.name}</p>
                <p>{file ? `${(file.size / 1024).toFixed(0)} KB` : ''}</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => onPickFile(null)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              JPG, PNG ou WebP · máximo 5 MB
            </p>
          )}
          {data && data.photos.length > 0 ? (
            <ul className="athena-list">
              {data.photos.map((p) => (
                <li key={p.id} className="athena-list-item text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    {p.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.publicUrl}
                        alt={p.type}
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block text-[var(--text)]">
                        {p.type === 'front'
                          ? 'Frente'
                          : p.type === 'side'
                            ? 'Lateral'
                            : p.type === 'back'
                              ? 'Costas'
                              : p.type}{' '}
                        · {new Date(p.takenAt).toLocaleString('pt-BR')}
                      </span>
                      <span className="block truncate text-[var(--muted)]">
                        {p.storagePath.split('/').pop()}
                      </span>
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 text-[var(--primary-hover)]"
                    disabled={deletingId === p.id}
                    onClick={() => void removePhoto(p.id)}
                    data-testid={`delete-photo-${p.id}`}
                  >
                    {deletingId === p.id ? 'Apagando…' : 'Apagar'}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
