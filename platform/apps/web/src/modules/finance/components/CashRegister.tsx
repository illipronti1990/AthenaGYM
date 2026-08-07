'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { CashSession, CashSessionReport } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { financeApi } from '../services/financeApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CashRegister({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CashSession | null>(null);
  const [report, setReport] = useState<CashSessionReport | null>(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [sangriaAmount, setSangriaAmount] = useState(0);
  const [sangriaNotes, setSangriaNotes] = useState('');
  const [supplyAmount, setSupplyAmount] = useState(0);
  const [supplyNotes, setSupplyNotes] = useState('');
  const [countedAmount, setCountedAmount] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const current = await financeApi.currentSession(accessToken);
      setSession(current);
      if (current?.status === 'open') {
        setCountedAmount(current.expectedAmount);
        setReport(null);
      } else if (current?.id) {
        const r = await financeApi.sessionReport(accessToken, current.id).catch(() => null);
        setReport(r);
      } else {
        setReport(null);
      }
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar caixa', 'error');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, push]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onOpen(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const s = await financeApi.openSession(accessToken, { openingAmount });
      setSession(s);
      push('Caixa aberto.');
      setOpeningAmount(0);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao abrir caixa', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onSangria(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      const s = await financeApi.sangria(accessToken, session.id, {
        amount: sangriaAmount,
        notes: sangriaNotes || undefined,
      });
      setSession(s);
      push('Sangria registrada.');
      setSangriaAmount(0);
      setSangriaNotes('');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro na sangria', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onSupply(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      const s = await financeApi.supply(accessToken, session.id, {
        amount: supplyAmount,
        notes: supplyNotes || undefined,
      });
      setSession(s);
      push('Suprimento registrado.');
      setSupplyAmount(0);
      setSupplyNotes('');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro no suprimento', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function onClose(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      const s = await financeApi.closeSession(accessToken, session.id, {
        countedAmount,
        notes: closeNotes || undefined,
      });
      setSession(s);
      const r = await financeApi.sessionReport(accessToken, s.id);
      setReport(r);
      push('Caixa fechado.');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao fechar caixa', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <TableSkeleton rows={4} />;

  const isOpen = session?.status === 'open';

  return (
    <div className="space-y-4" data-testid="cash-register">
      {!isOpen ? (
        <Card>
          <h2 className="athena-title mb-3 text-sm">Abrir caixa</h2>
          <form onSubmit={onOpen} className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="athena-label">Valor de abertura (R$)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={openingAmount}
                onChange={(e) => setOpeningAmount(Number(e.target.value))}
                className="athena-input mt-1 w-40"
              />
            </label>
            <Button type="submit" loading={busy} loadingLabel="Abrindo…">
              Abrir caixa
            </Button>
          </form>
        </Card>
      ) : null}

      {isOpen && session ? (
        <>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Caixa atual</p>
            <p className="mt-1 text-2xl font-bold text-[var(--gold)]">
              {brl(session.expectedAmount)}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Aberto em {new Date(session.openedAt).toLocaleString('pt-BR')} · abertura{' '}
              {brl(session.openingAmount)}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="athena-title mb-3 text-sm">Sangria</h2>
              <form onSubmit={onSangria} className="grid gap-2">
                <label className="block text-sm">
                  <span className="athena-label">Valor (R$)</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={sangriaAmount}
                    onChange={(e) => setSangriaAmount(Number(e.target.value))}
                    className="athena-input mt-1"
                  />
                </label>
                <label className="block text-sm">
                  <span className="athena-label">Observações</span>
                  <input
                    value={sangriaNotes}
                    onChange={(e) => setSangriaNotes(e.target.value)}
                    className="athena-input mt-1"
                  />
                </label>
                <Button type="submit" variant="secondary" loading={busy}>
                  Registrar sangria
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="athena-title mb-3 text-sm">Suprimento</h2>
              <form onSubmit={onSupply} className="grid gap-2">
                <label className="block text-sm">
                  <span className="athena-label">Valor (R$)</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={supplyAmount}
                    onChange={(e) => setSupplyAmount(Number(e.target.value))}
                    className="athena-input mt-1"
                  />
                </label>
                <label className="block text-sm">
                  <span className="athena-label">Observações</span>
                  <input
                    value={supplyNotes}
                    onChange={(e) => setSupplyNotes(e.target.value)}
                    className="athena-input mt-1"
                  />
                </label>
                <Button type="submit" variant="secondary" loading={busy}>
                  Registrar suprimento
                </Button>
              </form>
            </Card>
          </div>

          <Card>
            <h2 className="athena-title mb-3 text-sm">Fechar caixa</h2>
            <form onSubmit={onClose} className="grid gap-2 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="athena-label">Valor contado (R$)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={countedAmount}
                  onChange={(e) => setCountedAmount(Number(e.target.value))}
                  className="athena-input mt-1"
                />
              </label>
              <label className="block text-sm">
                <span className="athena-label">Observações</span>
                <input
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="athena-input mt-1"
                />
              </label>
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm text-[var(--muted)]">
                  Diferença prevista: {brl(countedAmount - session.expectedAmount)}
                </p>
                <Button type="submit" loading={busy} loadingLabel="Fechando…">
                  Fechar caixa
                </Button>
              </div>
            </form>
          </Card>
        </>
      ) : null}

      {report ? (
        <Card data-testid="cash-session-report">
          <h2 className="athena-title mb-3 text-sm">Relatório da sessão</h2>
          <ul className="divide-y divide-[var(--border)] text-sm">
            <li className="flex justify-between py-2">
              <span>Abertura</span>
              <span>{brl(report.session.openingAmount)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Vendas</span>
              <span>{brl(report.salesTotal)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Sangrias</span>
              <span>{brl(report.sangriaTotal)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Suprimentos</span>
              <span>{brl(report.supplyTotal)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Esperado</span>
              <span>{brl(report.session.expectedAmount)}</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Contado</span>
              <span>{brl(report.session.countedAmount ?? 0)}</span>
            </li>
            <li className="flex justify-between py-2 font-semibold">
              <span>Diferença</span>
              <span
                className={
                  (report.session.difference ?? 0) === 0
                    ? 'text-[var(--success,#16a34a)]'
                    : 'text-[var(--danger,#dc2626)]'
                }
              >
                {brl(report.session.difference ?? 0)}
              </span>
            </li>
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
