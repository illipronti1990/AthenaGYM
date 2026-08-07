'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Plan } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ux/ConfirmProvider';

export function PlansPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(129);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setPlans(await salesApi.plans(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha planos', 'error');
      setPlans([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDurationDays(30);
    setPrice(129);
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setName(plan.name);
    setDurationDays(plan.durationDays);
    setPrice(plan.price);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await salesApi.updatePlan(accessToken, editingId, {
          name,
          durationDays,
          price,
        });
        push('Plano atualizado');
      } else {
        await salesApi.createPlan(accessToken, { name, durationDays, price });
        push('Plano criado');
      }
      resetForm();
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
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
      await salesApi.deletePlan(accessToken, plan.id);
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
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <input
          required
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="movvo-input max-w-xs"
          data-testid="plan-name"
        />
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          className="movvo-input w-28"
          data-testid="plan-duration"
        />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="movvo-input w-28"
          data-testid="plan-price"
        />
        <Button type="submit" data-testid="plan-submit">
          {editingId ? 'Salvar' : 'Adicionar'}
        </Button>
        {editingId ? (
          <Button type="button" variant="secondary" onClick={resetForm} data-testid="plan-cancel-edit">
            Cancelar
          </Button>
        ) : null}
      </form>
      {!plans ? (
        <TableSkeleton />
      ) : (
        <div className="movvo-list overflow-x-auto">
          <table className="movvo-table" data-testid="plans-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th>Duração</th>
                <th>Valor</th>
                <th>Ativo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.durationDays} dias</td>
                  <td>{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{p.active ? 'Sim' : 'Não'}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(p)}
                        data-testid={`edit-plan-${p.id}`}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="border-[var(--primary)] text-[var(--primary-hover)] hover:bg-[var(--primary)] hover:text-white"
                        disabled={busyId === p.id}
                        onClick={() => void onDelete(p)}
                        data-testid={`delete-plan-${p.id}`}
                      >
                        {busyId === p.id ? 'Excluindo…' : 'Excluir'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
