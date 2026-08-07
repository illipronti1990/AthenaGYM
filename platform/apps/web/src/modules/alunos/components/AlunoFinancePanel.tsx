'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { FinanceSubscription, Receivable } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { financeApi } from '@/modules/finance/services/financeApi';
import { isReceivableOpen, receivableStatusLabel } from '@/modules/finance/utils/statusLabels';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const SUB_STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  past_due: 'Em atraso',
  cancelled: 'Cancelada',
};

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function subscriptionStatusLabel(status: string) {
  return SUB_STATUS_LABEL[status] || status;
}

export function AlunoFinancePanel({
  accessToken,
  studentId,
  unitId,
  planName,
}: {
  accessToken: string;
  studentId: string;
  unitId?: string;
  planName?: string | null;
}) {
  const { push } = useToast();
  const [receivables, setReceivables] = useState<Receivable[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<FinanceSubscription[]>([]);
  const [description, setDescription] = useState(planName ? `Mensalidade — ${planName}` : 'Mensalidade');
  const [amount, setAmount] = useState(129);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [recs, subs] = await Promise.all([
        financeApi.receivables(accessToken, studentId),
        financeApi.subscriptions(accessToken, studentId).catch(() => [] as FinanceSubscription[]),
      ]);
      setReceivables(recs);
      setSubscriptions(subs);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar financeiro', 'error');
      setReceivables([]);
      setSubscriptions([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentId]);

  const summary = useMemo(() => {
    const list = receivables || [];
    const open = list.filter((r) => isReceivableOpen(String(r.status)));
    const overdue = list.filter((r) => r.status === 'overdue');
    const paid = list.filter((r) => r.status === 'paid');
    return {
      openCount: open.length,
      openTotal: open.reduce((acc, r) => acc + r.amount - r.discount + r.interest + r.fine, 0),
      overdueCount: overdue.length,
      paidTotal: paid.reduce((acc, r) => acc + r.amount, 0),
    };
  }, [receivables]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await financeApi.createReceivable(accessToken, {
        description,
        amount,
        dueDate,
        studentId,
        ...(unitId ? { unitId } : {}),
      });
      push('Cobrança criada');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao criar cobrança', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    action: () => Promise<unknown>,
    ok: string,
  ) {
    try {
      await action();
      push(ok);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha na ação', 'error');
    }
  }

  if (!receivables) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6" data-testid="student-finance-panel">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Em aberto</p>
          <p className="mt-1 text-xl font-semibold text-[var(--gold)]">{money(summary.openTotal)}</p>
          <p className="text-xs text-[var(--muted)]">{summary.openCount} cobrança(s)</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Vencidas</p>
          <p className="mt-1 text-xl font-semibold text-[var(--primary)]">{summary.overdueCount}</p>
          <p className="text-xs text-[var(--muted)]">aguardando regularização</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Já recebido</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text)]">{money(summary.paidTotal)}</p>
          <p className="text-xs text-[var(--muted)]">histórico pago</p>
        </Card>
      </div>

      {subscriptions.length > 0 ? (
        <section>
          <h3 className="movvo-title mb-2 text-lg">Assinaturas</h3>
          <ul className="movvo-list">
            {subscriptions.map((s) => (
              <li key={s.id} className="movvo-list-item">
                <span>
                  {s.recurrence} · {money(s.amount)} · {subscriptionStatusLabel(String(s.status))}
                  {s.nextDueDate ? ` · próxima ${s.nextDueDate}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="movvo-title mb-3 text-lg">Nova cobrança</h3>
        <form onSubmit={onCreate} className="flex flex-wrap gap-2" data-testid="student-finance-form">
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="movvo-input max-w-xs"
            placeholder="Descrição"
          />
          <input
            type="number"
            step="0.01"
            min={0}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="movvo-input w-28"
          />
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="movvo-input w-auto"
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Gerar cobrança'}
          </Button>
        </form>
      </section>

      <section>
        <h3 className="movvo-title mb-3 text-lg">Cobranças</h3>
        {receivables.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma cobrança para este aluno.</p>
        ) : (
          <ul className="movvo-list" data-testid="student-receivables-list">
            {receivables.map((r) => (
              <li key={r.id} className="movvo-list-item flex-wrap">
                <span>
                  {r.description} · {money(r.amount)} · venc. {r.dueDate} ·{' '}
                  {receivableStatusLabel(String(r.status))}
                  {r.paidAt ? ` · pago em ${new Date(r.paidAt).toLocaleDateString('pt-BR')}` : ''}
                </span>
                <span className="flex flex-wrap gap-1">
                  {isReceivableOpen(String(r.status)) ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="!px-2 !py-1 text-xs"
                        onClick={() =>
                          void runAction(() => financeApi.receive(accessToken, r.id), 'Recebimento registrado')
                        }
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
                              push(
                                tx.copyPaste
                                  ? `PIX gerado: ${tx.copyPaste.slice(0, 48)}…`
                                  : 'PIX gerado',
                              );
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
                        onClick={() =>
                          void runAction(() => financeApi.cancel(accessToken, r.id), 'Cobrança cancelada')
                        }
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
                      onClick={() =>
                        void runAction(() => financeApi.refund(accessToken, r.id), 'Estorno registrado')
                      }
                    >
                      Estornar
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
