'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Plan } from '@athenas/shared';
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
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          className="w-28 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-28 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-[#A3001B] px-4 py-2 text-sm font-semibold text-white">
          Adicionar
        </button>
      </form>
      {!plans ? (
        <TableSkeleton />
      ) : (
        <table className="min-w-full rounded border border-zinc-200 bg-white text-left text-sm">
          <thead className="border-b bg-zinc-50">
            <tr>
              <th className="px-3 py-2">Plano</th>
              <th className="px-3 py-2">Duração</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.durationDays} dias</td>
                <td className="px-3 py-2">
                  {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-3 py-2">{p.active ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
