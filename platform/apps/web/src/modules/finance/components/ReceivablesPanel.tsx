'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Receivable } from '@athena/shared';
import { Button } from '@athena/ui';
import { financeApi } from '../services/financeApi';
import { isReceivableOpen, receivableStatusLabel } from '../utils/statusLabels';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';

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
      <div className="flex justify-end">
        <ExportButtons accessToken={accessToken} resource="receivables" />
      </div>
      <form onSubmit={onCreate} className="flex flex-wrap gap-2">
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="athena-input max-w-xs"
          placeholder="Descrição"
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="athena-input w-28"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="athena-input w-auto"
        />
        <Button type="submit">Nova cobrança</Button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="athena-list" data-testid="receivables-list">
          {items.map((r) => (
            <li key={r.id} className="athena-list-item flex-wrap">
              <span>
                {r.description} ·{' '}
                {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {r.dueDate} ·{' '}
                {receivableStatusLabel(String(r.status))}
              </span>
              <span className="flex flex-wrap gap-1">
                {isReceivableOpen(String(r.status)) ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => void financeApi.receive(accessToken, r.id).then(load)}
                    >
                      Receber
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() =>
                        void financeApi
                          .pix(accessToken, r.id)
                          .then((tx) => {
                            push(`PIX: ${tx.copyPaste?.slice(0, 40)}…`);
                            return load();
                          })
                          .catch((e) => push(String(e), 'error'))
                      }
                    >
                      Gerar PIX
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => void financeApi.cancel(accessToken, r.id).then(load)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
                {r.status === 'paid' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-2 !py-1 text-xs"
                    onClick={() => void financeApi.refund(accessToken, r.id).then(load)}
                  >
                    Estornar
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
