'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  CashflowPoint,
  CostCenter,
  DreReport,
  FinanceSubscription,
  FinancialAccount,
  Payable,
} from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { financeApi } from '../services/financeApi';
import { listStudents } from '@/modules/students/services/studentsApi';
import { salesApi } from '@/modules/sales/services/salesApi';
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
          className="athena-input max-w-[160px]"
          placeholder="Fornecedor"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="athena-input max-w-xs"
        />
        <input
          type="number"
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
        <Button type="submit">Adicionar</Button>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="athena-list">
          {items.map((p) => (
            <li key={p.id} className="athena-list-item">
              <span>
                {p.description} ·{' '}
                {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {p.status}
              </span>
              {p.status === 'open' ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="!px-2 !py-1 text-xs"
                  onClick={() => void financeApi.payPayable(accessToken, p.id).then(load)}
                >
                  Pagar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SUB_STATUS: Record<string, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  past_due: 'Em atraso',
};

const RECURRENCE: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function SubscriptionsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<FinanceSubscription[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [planNames, setPlanNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      try {
        const [subs, studentsRes, plans] = await Promise.all([
          financeApi.subscriptions(accessToken),
          listStudents(accessToken, { pageSize: '200' }).catch(() => ({ items: [] as never[] })),
          salesApi.plans(accessToken).catch(() => []),
        ]);
        setItems(subs);
        const byStudent: Record<string, string> = {};
        for (const s of studentsRes.items || []) byStudent[s.id] = s.fullName;
        setNames(byStudent);
        const byPlan: Record<string, string> = {};
        for (const p of plans) byPlan[p.id] = p.name;
        setPlanNames(byPlan);
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha', 'error');
        setItems([]);
      }
    })();
  }, [accessToken, push]);

  if (!items) return <TableSkeleton />;
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Nenhuma assinatura ainda. Cadastre um aluno com plano (ex.: Mensal) ou vincule um plano no
        perfil do aluno — a assinatura é gerada automaticamente.
      </p>
    );
  }
  return (
    <ul className="athena-list" data-testid="subscriptions-list">
      {items.map((s) => (
        <li key={s.id} className="athena-list-item">
          <span>
            {names[s.studentId] || 'Aluno'} · {planNames[s.planId] || 'Plano'} ·{' '}
            {RECURRENCE[String(s.recurrence)] || s.recurrence} ·{' '}
            {s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · próximo{' '}
            {s.nextDueDate || '—'} · {SUB_STATUS[String(s.status)] || s.status}
          </span>
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
    <div className="athena-list overflow-x-auto">
      <table className="athena-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Entradas</th>
            <th>Saídas</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.inflow}</td>
              <td>{p.outflow}</td>
              <td>{p.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <ul className="athena-list">
      {rows.map(([label, value]) => (
        <li key={String(label)} className="athena-list-item">
          <span>{label}</span>
          <span className="font-semibold text-[var(--gold)]">
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
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
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  function resetForm() {
    setEditingId(null);
    setBankName('');
    setAgency('');
    setAccount('');
    setPixKey('');
  }

  function startEdit(a: FinancialAccount) {
    setEditingId(a.id);
    setBankName(a.bankName);
    setAgency(a.agency || '');
    setAccount(a.account || '');
    setPixKey(a.pixKey || '');
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!bankName.trim()) {
      push('Informe o banco', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        bankName: bankName.trim(),
        agency: agency.trim() || undefined,
        account: account.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
      };
      if (editingId) {
        await financeApi.updateAccount(accessToken, editingId, body);
        push('Conta atualizada');
      } else {
        await financeApi.createAccount(accessToken, body);
        push('Conta cadastrada');
      }
      resetForm();
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao salvar conta', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="athena-title mb-3 text-sm">Contas bancárias / PIX</h2>
        <form onSubmit={onSave} className="mb-4 grid gap-2" data-testid="bank-account-form">
          <input
            required
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="athena-input"
            placeholder="Banco (ex.: Itaú, Nubank)"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="athena-input"
              placeholder="Agência"
            />
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="athena-input"
              placeholder="Conta"
            />
          </div>
          <input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className="athena-input"
            placeholder="Chave PIX (e-mail, CPF, telefone ou aleatória)"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar conta'}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
        {accounts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma conta cadastrada.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] text-sm" data-testid="bank-accounts-list">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {a.bankName}
                  {a.agency ? ` · ag ${a.agency}` : ''}
                  {a.account ? ` · cc ${a.account}` : ''}
                  {a.pixKey ? ` · PIX ${a.pixKey}` : ''}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-2 !py-1 text-xs"
                  onClick={() => startEdit(a)}
                >
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="athena-title mb-3 text-sm">Centros de custo</h2>
        <ul className="divide-y divide-[var(--border)] text-sm">
          {centers.map((c) => (
            <li key={c.id} className="py-2">
              {c.name}
            </li>
          ))}
        </ul>
      </Card>
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
        className="athena-input w-auto"
      >
        <option value="csv">CSV</option>
        <option value="ofx">OFX</option>
      </select>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="athena-input font-mono text-xs"
      />
      <Button type="submit">Importar e conciliar</Button>
    </form>
  );
}
