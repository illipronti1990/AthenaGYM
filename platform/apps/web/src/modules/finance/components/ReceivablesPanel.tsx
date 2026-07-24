'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Receivable } from '@athenas/shared';
import { financeApi } from '../services/financeApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function ReceivablesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Receivable[] | null>(null);
  const [description, setDescription] = useState('Mensalidade');
  const [amount, setAmount] = useState(129);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    try {
      setItems(await financeApi.receivables(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await financeApi.createReceivable(accessToken, { description, amount, dueDate });
      push('Cobrança criada');
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Descrição"
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-28 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-[#A3001B] px-4 py-2 text-sm font-semibold text-white">
          Nova cobrança
        </button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="divide-y rounded border border-zinc-200 bg-white text-sm" data-testid="receivables-list">
          {items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span>
                {r.description} · {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
                {r.dueDate} · {r.status}
              </span>
              <span className="flex gap-1">
                {r.status !== 'paid' && r.status !== 'cancelled' ? (
                  <>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => void financeApi.receive(accessToken, r.id).then(load)}
                    >
                      Receber
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() =>
                        void financeApi
                          .pix(accessToken, r.id)
                          .then((tx) => push(`PIX: ${tx.copyPaste?.slice(0, 40)}…`))
                          .catch((e) => push(String(e), 'error'))
                      }
                    >
                      Gerar PIX
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => void financeApi.cancel(accessToken, r.id).then(load)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : null}
                {r.status === 'paid' ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void financeApi.refund(accessToken, r.id).then(load)}
                  >
                    Estornar
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
