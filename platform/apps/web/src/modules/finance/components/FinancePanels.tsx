'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  CashflowPoint,
  CostCenter,
  DreReport,
  FinanceSubscription,
  FinancialAccount,
  Payable,
  PayableCategory,
} from '@movvo/shared';
import { PAYABLE_CATEGORIES, PAYABLE_CATEGORY_LABELS } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { financeApi } from '../services/financeApi';
import { payableStatusLabel } from '../utils/statusLabels';
import { listAlunos } from '@/modules/alunos/services/alunosApi';
import { salesApi } from '@/modules/sales/services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ux/ConfirmProvider';

export function PayablesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Payable[] | null>(null);
  const [description, setDescription] = useState('Aluguel');
  const [amount, setAmount] = useState(2500);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState('Fornecedor');
  const [category, setCategory] = useState<PayableCategory>('outros');

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
      await financeApi.createPayable(accessToken, {
        description,
        amount,
        dueDate,
        supplierName,
        category,
      });
      push('Conta a pagar criada');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <div className="space-y-4" data-testid="payables-panel">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-3"
      >
        <label className="block text-sm">
          <span className="movvo-label">Fornecedor</span>
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="movvo-input mt-1"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Descrição</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="movvo-input mt-1"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Categoria</span>
          <select
            className="movvo-input mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value as PayableCategory)}
          >
            {PAYABLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PAYABLE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Valor (R$)</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="movvo-input mt-1"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="movvo-label">Vencimento</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="movvo-input mt-1"
            required
          />
        </label>
        <div className="flex items-end">
          <Button type="submit">Adicionar</Button>
        </div>
      </form>
      {!items ? (
        <TableSkeleton />
      ) : (
        <ul className="movvo-list">
          {items.map((p) => (
            <li key={p.id} className="movvo-list-item flex-wrap gap-2">
              <span className="min-w-0 flex-1">
                {p.description} ·{' '}
                {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
                {PAYABLE_CATEGORY_LABELS[p.category as PayableCategory] || p.category} ·{' '}
                {payableStatusLabel(String(p.status))}
                {p.supplierName ? ` · ${p.supplierName}` : ''}
              </span>
              <div className="flex flex-wrap gap-2">
                {p.status === 'open' ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => void financeApi.payPayable(accessToken, p.id).then(load)}
                    >
                      Pagar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() =>
                        void financeApi
                          .cancelPayable(accessToken, p.id)
                          .then(load)
                          .catch((e) => push(String(e), 'error'))
                      }
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
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
  const [renewing, setRenewing] = useState(false);

  async function load() {
    try {
      const [subs, studentsRes, plans] = await Promise.all([
        financeApi.subscriptions(accessToken),
        listAlunos(accessToken, { pageSize: '200' }).catch(() => ({ items: [] as never[] })),
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
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onRenewDue() {
    setRenewing(true);
    try {
      const res = await financeApi.renewDue(accessToken);
      push(
        res.renewed > 0
          ? `${res.renewed} mensalidade(s) renovada(s).`
          : 'Nenhuma mensalidade vencida para renovar.',
      );
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao renovar', 'error');
    } finally {
      setRenewing(false);
    }
  }

  if (!items) return <TableSkeleton />;

  return (
    <div className="space-y-4" data-testid="subscriptions-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted)]">Assinaturas ativas e cobranças recorrentes.</p>
        <Button
          type="button"
          onClick={() => void onRenewDue()}
          loading={renewing}
          loadingLabel="Renovando…"
          data-testid="renew-due-btn"
        >
          Renovar vencidas
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Nenhuma assinatura ainda. Cadastre um aluno com plano (ex.: Mensal) ou vincule um plano no
          perfil do aluno — a assinatura é gerada automaticamente.
        </p>
      ) : (
        <ul className="movvo-list" data-testid="subscriptions-list">
          {items.map((s) => (
            <li key={s.id} className="movvo-list-item">
              <span>
                {names[s.studentId] || 'Aluno'} · {planNames[s.planId] || 'Plano'} ·{' '}
                {RECURRENCE[String(s.recurrence)] || s.recurrence} ·{' '}
                {s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · próximo{' '}
                {s.nextDueDate || '—'} · {SUB_STATUS[String(s.status)] || s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CashflowPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [points, setPoints] = useState<CashflowPoint[] | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  async function load() {
    try {
      setPoints(await financeApi.cashflow(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha', 'error');
      setPoints([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onDelete(date: string) {
    const ok = await confirm({
      title: `Excluir lançamentos do dia ${date}?`,
      message: 'Os lançamentos deste dia serão removidos do fluxo de caixa.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    setDeletingDate(date);
    try {
      await financeApi.deleteCashflowDay(accessToken, date);
      push('Dia removido do fluxo de caixa');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao excluir', 'error');
    } finally {
      setDeletingDate(null);
    }
  }

  if (!points) return <TableSkeleton />;
  return (
    <div className="movvo-list overflow-x-auto">
      <table className="movvo-table" data-testid="cashflow-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Entradas</th>
            <th>Saídas</th>
            <th>Saldo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.inflow}</td>
              <td>{p.outflow}</td>
              <td>{p.balance}</td>
              <td>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-[var(--primary)] text-[var(--primary-hover)] hover:bg-[var(--primary)] hover:text-white"
                  disabled={deletingDate === p.date}
                  onClick={() => void onDelete(p.date)}
                  data-testid={`delete-cashflow-${p.date}`}
                >
                  {deletingDate === p.date ? 'Excluindo…' : 'Excluir'}
                </Button>
              </td>
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
    <ul className="movvo-list">
      {rows.map(([label, value]) => (
        <li key={String(label)} className="movvo-list-item">
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
  const [centerName, setCenterName] = useState('');

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

  async function onCreateCenter(e: FormEvent) {
    e.preventDefault();
    if (!centerName.trim()) return;
    try {
      await financeApi.createCostCenter(accessToken, { name: centerName.trim() });
      push('Centro de custo criado');
      setCenterName('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="movvo-title mb-3 text-sm">Contas bancárias / PIX</h2>
        <form onSubmit={onSave} className="mb-4 grid gap-2" data-testid="bank-account-form">
          <label className="block text-sm">
            <span className="movvo-label">Banco</span>
            <input
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="movvo-input mt-1"
              placeholder="Ex.: Itaú, Nubank"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="movvo-label">Agência</span>
              <input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="movvo-input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="movvo-label">Conta</span>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="movvo-input mt-1"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="movvo-label">Chave PIX</span>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="movvo-input mt-1"
              placeholder="E-mail, CPF, telefone ou aleatória"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar conta'}
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
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
                  variant="secondary"
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
        <h2 className="movvo-title mb-3 text-sm">Centros de custo</h2>
        <form onSubmit={onCreateCenter} className="mb-3 flex flex-wrap gap-2">
          <label className="block min-w-[180px] flex-1 text-sm">
            <span className="movvo-label">Nome</span>
            <input
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              className="movvo-input mt-1"
              required
            />
          </label>
          <div className="flex items-end">
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
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
      <label className="block text-sm">
        <span className="movvo-label">Formato</span>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as 'csv' | 'ofx')}
          className="movvo-input mt-1 w-auto"
        >
          <option value="csv">CSV</option>
          <option value="ofx">OFX</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="movvo-label">Conteúdo do extrato</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="movvo-input mt-1 font-mono text-xs"
        />
      </label>
      <Button type="submit">Importar e conciliar</Button>
    </form>
  );
}
