'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Assessment, ProgressSummary } from '@movvo/shared';
import {
  Button,
  Card,
  ConfirmDialog,
  Form,
  FormActions,
  FormInput,
  FormRow,
  FormSection,
  FormSelect,
  AutoSaveIndicator,
} from '@movvo/ui';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ContextualActions } from '@/components/ux/ContextualActions';
import { formsApi } from '@/modules/forms/services/formsApi';
import { useAutosave } from '@/hooks/useAutosave';

export function AlunoAssessmentsPanel({
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Assessment | null>(null);

  const draftKey = JSON.stringify({ weight, height, bodyFat, sex });
  const autosaveStatus = useAutosave({
    value: draftKey,
    enabled: Boolean(studentId),
    onSave: async (serialized) => {
      const payload = JSON.parse(serialized) as Record<string, unknown>;
      await formsApi.autosave(accessToken, {
        formKey: `assessment:${studentId}`,
        entityId: studentId,
        payload,
      });
    },
  });

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

  async function onDelete(assessment: Assessment) {
    setDeletingId(assessment.id);
    try {
      await workoutsApi.deleteAssessment(accessToken, assessment.id);
      push('Avaliação excluída');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao excluir avaliação', 'error');
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  if (!items) return <TableSkeleton rows={5} />;

  const lastDate = items[0]?.createdAt;
  const stale =
    !lastDate || Date.now() - new Date(lastDate).getTime() > 90 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6" data-testid="student-assessments-panel">
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir avaliação física?"
        message="Essa ação não poderá ser desfeita."
        confirmLabel="Excluir"
        danger
        loading={Boolean(deletingId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void onDelete(pendingDelete);
        }}
      />

      {stale ? (
        <ContextualActions
          title="Sugestão"
          actions={[
            {
              id: 'reassess',
              label: items.length ? 'Agendar reavaliação' : 'Criar primeira avaliação',
              onClick: () => {
                document
                  .querySelector<HTMLElement>('[data-testid="student-assessment-form"]')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              },
              variant: 'primary',
            },
          ]}
        />
      ) : null}

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

      <Form onSubmit={onCreate} data-testid="student-assessment-form">
        <FormSection title="Nova avaliação" description="Medidas principais com autosave do rascunho.">
          <div className="mb-2 flex justify-end">
            <AutoSaveIndicator status={autosaveStatus} />
          </div>
          <FormRow cols={4}>
            <FormInput
              label="Peso (kg)"
              required
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <FormInput
              label="Altura (cm)"
              required
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <FormInput
              label="% Gordura"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
            <FormSelect
              label="Sexo"
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
              options={[
                { value: 'female', label: 'Feminino' },
                { value: 'male', label: 'Masculino' },
                { value: 'other', label: 'Outro' },
              ]}
            />
          </FormRow>
          <FormActions>
            <Button type="submit" loading={saving} loadingLabel="Salvando…">
              Salvar avaliação
            </Button>
          </FormActions>
        </FormSection>
      </Form>

      <section>
        <h3 className="movvo-title mb-3 text-lg">Histórico de avaliações</h3>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma avaliação registrada.</p>
        ) : (
          <ul className="movvo-list" data-testid="student-assessments-list">
            {items.map((a) => (
              <li key={a.id} className="movvo-list-item">
                <span>
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.weight ?? '—'} kg · IMC{' '}
                  {a.bmi ?? '—'} · BF {a.bodyFat ?? '—'}%
                  {a.leanMass != null ? ` · massa magra ${a.leanMass} kg` : ''}
                </span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={deletingId === a.id}
                  onClick={() => setPendingDelete(a)}
                  data-testid={`delete-student-assessment-${a.id}`}
                >
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
