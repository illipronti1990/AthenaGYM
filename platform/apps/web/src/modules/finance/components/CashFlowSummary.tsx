'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CashflowSummary } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { financeApi, type CashflowSummaryParams } from '../services/financeApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

type RangeKey = NonNullable<CashflowSummaryParams['range']>;

const RANGES: { id: RangeKey; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'custom', label: 'Personalizado' },
];

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CashFlowSummary({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [range, setRange] = useState<RangeKey>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<CashflowSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: CashflowSummaryParams = { range };
      if (range === 'custom') {
        params.from = from || undefined;
        params.to = to || undefined;
      }
      setData(await financeApi.cashflowSummary(accessToken, params));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no resumo de fluxo', 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, range, from, to, push]);

  useEffect(() => {
    if (range === 'custom' && (!from || !to)) {
      setLoading(false);
      return;
    }
    void load();
  }, [load, range, from, to]);

  return (
    <div className="space-y-4" data-testid="cashflow-summary">
      <div className="flex flex-wrap items-end gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.id}
            type="button"
            variant={range === r.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </Button>
        ))}
        {range === 'custom' ? (
          <>
            <label className="block text-sm">
              <span className="athena-label">De</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="athena-input mt-1 w-auto"
              />
            </label>
            <label className="block text-sm">
              <span className="athena-label">Até</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="athena-input mt-1 w-auto"
              />
            </label>
            <Button type="button" size="sm" onClick={() => void load()} disabled={!from || !to}>
              Aplicar
            </Button>
          </>
        ) : null}
      </div>

      {loading ? (
        <TableSkeleton rows={2} />
      ) : !data ? (
        <p className="text-sm text-[var(--muted)]">
          {range === 'custom' && (!from || !to)
            ? 'Informe o período personalizado.'
            : 'Não foi possível carregar o resumo.'}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Saldo inicial</p>
              <p className="mt-2 text-xl font-bold">{brl(data.openingBalance)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Entradas</p>
              <p className="mt-2 text-xl font-bold text-[var(--success,#16a34a)]">{brl(data.inflow)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Saídas</p>
              <p className="mt-2 text-xl font-bold text-[var(--danger,#dc2626)]">{brl(data.outflow)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Saldo final</p>
              <p className="mt-2 text-xl font-bold text-[var(--gold)]">{brl(data.closingBalance)}</p>
            </Card>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Período: {data.from} → {data.to}
          </p>
        </>
      )}
    </div>
  );
}
