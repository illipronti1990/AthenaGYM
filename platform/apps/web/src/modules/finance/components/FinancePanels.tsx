'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  CashflowPoint,
  CostCenter,
  DreReport,
  FinanceSubscription,
  FinancialAccount,
  Payable,
} from '@athenas/shared';
import { financeApi } from '../services/financeApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function PayablesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Payable[] | null>(null);
  const [description, setDescription] = useState('Aluguel');
  const [amount, setAmount] = useState(2500);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState('Fornecedor');

  async function load() {
    try {
      setItems(await financeApi.payables(accessToken));
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
      await financeApi.createPayable(accessToken, { description, amount, dueDate, supplierName });
      push('Conta a pagar criada');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap gap-2">
        <input
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Fornecedor"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
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
          Adicionar
        </button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="divide-y rounded border border-zinc-200 bg-white text-sm">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2">
              <span>
                {p.description} · {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
                {p.status}
              </span>
              {p.status === 'open' ? (
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => void financeApi.payPayable(accessToken, p.id).then(load)}
                >
                  Pagar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SubscriptionsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<FinanceSubscription[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await financeApi.subscriptions(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha', 'error');
        setItems([]);
      }
    })();
  }, [accessToken, push]);

  if (!items) return <TableSkeleton />;
  return (
    <ul className="divide-y rounded border border-zinc-200 bg-white text-sm">
      {items.map((s) => (
        <li key={s.id} className="px-3 py-2">
          Aluno {s.studentId.slice(0, 8)}… · plano {s.planId.slice(0, 8)}… · {s.recurrence} ·{' '}
          {s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · próximo{' '}
          {s.nextDueDate || '—'} · {s.status}
        </li>
      ))}
    </ul>
  );
}

export function CashflowPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [points, setPoints] = useState<CashflowPoint[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setPoints(await financeApi.cashflow(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha', 'error');
        setPoints([]);
      }
    })();
  }, [accessToken, push]);

  if (!points) return <TableSkeleton />;
  return (
    <table className="min-w-full rounded border border-zinc-200 bg-white text-left text-sm">
      <thead className="border-b bg-zinc-50">
        <tr>
          <th className="px-3 py-2">Data</th>
          <th className="px-3 py-2">Entradas</th>
          <th className="px-3 py-2">Saídas</th>
          <th className="px-3 py-2">Saldo</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.date} className="border-b">
            <td className="px-3 py-2">{p.date}</td>
            <td className="px-3 py-2">{p.inflow}</td>
            <td className="px-3 py-2">{p.outflow}</td>
            <td className="px-3 py-2">{p.balance}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DrePanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [dre, setDre] = useState<DreReport | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setDre(await financeApi.dre(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha', 'error');
      }
    })();
  }, [accessToken, push]);

  if (!dre) return <TableSkeleton rows={6} />;
  const rows = [
    ['Receita bruta', dre.grossRevenue],
    ['Descontos', dre.discounts],
    ['Receita líquida', dre.netRevenue],
    ['Custos', dre.costs],
    ['Despesas', dre.expenses],
    ['Lucro operacional', dre.operatingProfit],
    ['Resultado', dre.result],
  ];
  return (
    <ul className="divide-y rounded border border-zinc-200 bg-white text-sm">
      {rows.map(([label, value]) => (
        <li key={String(label)} className="flex justify-between px-3 py-2">
          <span>{label}</span>
          <span className="font-semibold">
            {Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SettingsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [a, c] = await Promise.all([
          financeApi.accounts(accessToken),
          financeApi.costCenters(accessToken),
        ]);
        setAccounts(a);
        setCenters(c);
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha', 'error');
      }
    })();
  }, [accessToken, push]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h2 className="mb-2 font-semibold">Contas bancárias</h2>
        <ul className="divide-y rounded border bg-white text-sm">
          {accounts.map((a) => (
            <li key={a.id} className="px-3 py-2">
              {a.bankName} · ag {a.agency} · cc {a.account} · PIX {a.pixKey || '—'}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Centros de custo</h2>
        <ul className="divide-y rounded border bg-white text-sm">
          {centers.map((c) => (
            <li key={c.id} className="px-3 py-2">
              {c.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReconciliationPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [content, setContent] = useState('2026-07-01,Mensalidade PIX,129.00');
  const [format, setFormat] = useState<'csv' | 'ofx'>('csv');

  async function onImport(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await financeApi.importReconciliation(accessToken, {
        content,
        format,
        fileName: format === 'csv' ? 'extrato.csv' : 'extrato.ofx',
      });
      push(`Importados ${res.imported}, conciliados ${res.matched}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <form onSubmit={onImport} className="space-y-3">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'csv' | 'ofx')}
        className="rounded border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="csv">CSV</option>
        <option value="ofx">OFX</option>
      </select>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
      />
      <button type="submit" className="rounded bg-[#A3001B] px-4 py-2 text-sm font-semibold text-white">
        Importar e conciliar
      </button>
    </form>
  );
}
