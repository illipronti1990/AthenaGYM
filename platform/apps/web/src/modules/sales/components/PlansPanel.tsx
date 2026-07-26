'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Plan } from '@athena/shared';
import { Button } from '@athena/ui';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function PlansPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(129);

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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await salesApi.createPlan(accessToken, { name, durationDays, price });
      push('Plano criado');
      setName('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap gap-2">
        <input
          required
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="athena-input max-w-xs"
        />
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          className="athena-input w-28"
        />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="athena-input w-28"
        />
        <Button type="submit">Adicionar</Button>
      </form>
      {!plans ? (
        <TableSkeleton />
      ) : (
        <div className="athena-list overflow-x-auto">
          <table className="athena-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th>Duração</th>
                <th>Valor</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.durationDays} dias</td>
                  <td>{p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{p.active ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
