'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Plan, PlanType } from '@movvo/shared';
import { PLAN_TYPE_LABELS } from '@movvo/shared';
import { Button, formatCurrencyBRL } from '@movvo/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ux/ConfirmProvider';

const PLAN_TYPES = Object.keys(PLAN_TYPE_LABELS) as PlanType[];

const emptyForm = {
  name: '',
  planType: 'mensal' as string,
  category: 'standard',
  durationDays: 30,
  price: 129,
  enrollmentFee: 0,
  fidelityDays: 0,
  graceDays: 0,
  discountPercent: 0,
  notes: '',
};

export function PlansPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setPlans(await matriculasApi.plans(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao listar planos', 'error');
      setPlans([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      planType: String(plan.planType || 'mensal'),
      category: plan.category || 'standard',
      durationDays: plan.durationDays,
      price: plan.price,
      enrollmentFee: plan.enrollmentFee,
      fidelityDays: plan.fidelityDays || 0,
      graceDays: plan.graceDays || 0,
      discountPercent: plan.discountPercent || 0,
      notes: plan.notes || '',
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const body = {
        name: form.name,
        planType: form.planType,
        category: form.category,
        durationDays: form.durationDays,
        price: form.price,
        enrollmentFee: form.enrollmentFee,
        fidelityDays: form.fidelityDays,
        graceDays: form.graceDays,
        discountPercent: form.discountPercent,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await matriculasApi.updatePlan(accessToken, editingId, body);
        push('Plano atualizado');
      } else {
        await matriculasApi.createPlan(accessToken, body);
        push('Plano criado');
      }
      resetForm();
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao salvar plano', 'error');
    }
  }

  async function onDelete(plan: Plan) {
    const ok = await confirm({
      title: `Excluir o plano "${plan.name}"?`,
      message: 'Essa ação não poderá ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    setBusyId(plan.id);
    try {
      await matriculasApi.deletePlan(accessToken, plan.id);
      push('Plano excluído');
      if (editingId === plan.id) resetForm();
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao excluir', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4" data-testid="matriculas-plans-panel">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="movvo-label">Nome do plano</span>
          <input
            required
            placeholder="Ex.: Mensal Premium"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="movvo-input mt-1"
            data-testid="plan-name"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Tipo</span>
          <select
            className="movvo-input mt-1"
            value={form.planType}
            onChange={(e) => setForm((f) => ({ ...f, planType: e.target.value }))}
            data-testid="plan-type"
          >
            {PLAN_TYPES.map((t) => (
              <option key={t} value={t}>
                {PLAN_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Duração (dias)</span>
          <input
            type="number"
            min={1}
            value={form.durationDays}
            onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
            className="movvo-input mt-1"
            data-testid="plan-duration"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Valor (R$)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            className="movvo-input mt-1"
            data-testid="plan-price"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Taxa de matrícula (R$)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.enrollmentFee}
            onChange={(e) => setForm((f) => ({ ...f, enrollmentFee: Number(e.target.value) }))}
            className="movvo-input mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Fidelidade (dias)</span>
          <input
            type="number"
            min={0}
            value={form.fidelityDays}
            onChange={(e) => setForm((f) => ({ ...f, fidelityDays: Number(e.target.value) }))}
            className="movvo-input mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Carência (dias)</span>
          <input
            type="number"
            min={0}
            value={form.graceDays}
            onChange={(e) => setForm((f) => ({ ...f, graceDays: Number(e.target.value) }))}
            className="movvo-input mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Desconto (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.discountPercent}
            onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
            className="movvo-input mt-1"
          />
        </label>
        <label className="block text-sm md:col-span-3">
          <span className="movvo-label">Observações</span>
          <input
            placeholder="Opcional"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="movvo-input mt-1"
          />
        </label>
        <div className="flex gap-2 md:col-span-3">
          <Button type="submit" data-testid="plan-save">
            {editingId ? 'Salvar alterações' : 'Criar plano'}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(plans || []).map((plan) => (
          <article
            key={plan.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            data-testid={`plan-card-${plan.id}`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="movvo-title text-lg">{plan.name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {PLAN_TYPE_LABELS[plan.planType as PlanType] || plan.planType} · {plan.durationDays} dias
                </p>
              </div>
              <span className={`text-xs ${plan.active ? 'text-[var(--success)]' : 'text-[var(--muted)]'}`}>
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="mb-3 text-xl font-semibold text-[var(--gold)]">{formatCurrencyBRL(plan.price)}</p>
            <p className="mb-4 text-xs text-[var(--muted)]">
              Taxa {formatCurrencyBRL(plan.enrollmentFee)} · Fidelidade {plan.fidelityDays}d · Carência{' '}
              {plan.graceDays}d
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(plan)}>
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                loading={busyId === plan.id}
                onClick={() => void onDelete(plan)}
              >
                Excluir
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
