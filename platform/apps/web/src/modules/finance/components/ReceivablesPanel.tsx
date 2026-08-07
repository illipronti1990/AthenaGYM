'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Receivable } from '@movvo/shared';
import {
  MovvoDataGrid,
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  Form,
  FormActions,
  FormInput,
  FormRow,
  FormSection,
  type DataGridColumn,
  type DataGridFilterDef,
  type DataGridSort,
  type WorkPanel,
} from '@movvo/ui';
import { financeApi } from '../services/financeApi';
import {
  isReceivableOpen,
  receivableBadgeTone,
  receivableDisplayStatus,
  receivableStatusLabel,
} from '../utils/statusLabels';
import { PaymentModal } from './PaymentModal';
import { useToast } from '@/components/ui/Toast';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';
import { useDataGridPrefs } from '@/modules/datagrid/hooks/useDataGridPrefs';

const TABLE_ID = 'receivables';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

const WORK_PANELS: WorkPanel[] = [
  {
    id: 'due-today',
    label: 'Vencem hoje',
    tone: 'info',
    filters: { panel: 'due-today' },
  },
  {
    id: 'overdue',
    label: 'Pagamentos vencidos',
    tone: 'danger',
    filters: { panel: 'overdue' },
  },
  {
    id: 'month',
    label: 'Receitas do mês',
    tone: 'success',
    filters: { panel: 'month' },
  },
  {
    id: 'open',
    label: 'Em aberto',
    tone: 'warn',
    filters: { status: 'open' },
  },
];

export function ReceivablesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const prefs = useDataGridPrefs(accessToken, TABLE_ID);

  const [allItems, setAllItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('Mensalidade');
  const [amount, setAmount] = useState(129);
  const [dueDate, setDueDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [payTarget, setPayTarget] = useState<Receivable | null>(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataGridSort | null>({ id: 'dueDate', desc: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      setAllItems(await financeApi.receivables(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha', 'error');
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!prefs.ready) return;
    if (prefs.preferences.pageSize) setPageSize(prefs.preferences.pageSize);
    if (prefs.preferences.sort) setSort(prefs.preferences.sort);
  }, [prefs.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await financeApi.createReceivable(accessToken, { description, amount, dueDate });
      push('Cobrança criada com sucesso.');
      setDescription('Mensalidade');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const month = monthPrefix();
    let rows = [...allItems];

    if (filters.panel === 'due-today') {
      rows = rows.filter(
        (r) =>
          receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus) === 'due_today',
      );
    } else if (filters.panel === 'overdue') {
      rows = rows.filter(
        (r) => receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus) === 'overdue',
      );
    } else if (filters.panel === 'month') {
      rows = rows.filter(
        (r) =>
          r.status === 'paid' &&
          ((r.paidAt && r.paidAt.slice(0, 7) === month) ||
            (r.competenceMonth && r.competenceMonth.startsWith(month))),
      );
    } else if (filters.status === 'open') {
      rows = rows.filter((r) => isReceivableOpen(String(r.status)));
    } else if (filters.status === 'paid') {
      rows = rows.filter((r) => r.status === 'paid');
    } else if (filters.status === 'partial') {
      rows = rows.filter((r) => r.status === 'partial');
    } else if (filters.status === 'due_today') {
      rows = rows.filter(
        (r) =>
          receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus) === 'due_today',
      );
    } else if (filters.status === 'overdue') {
      rows = rows.filter(
        (r) => receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus) === 'overdue',
      );
    } else if (filters.status) {
      rows = rows.filter((r) => String(r.status) === filters.status);
    }

    if (q) {
      rows = rows.filter((r) => {
        const ds = receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus);
        return (
          r.description.toLowerCase().includes(q) ||
          String(r.amount).includes(q) ||
          r.dueDate.includes(q) ||
          receivableStatusLabel(ds).toLowerCase().includes(q) ||
          (r.studentName || '').toLowerCase().includes(q)
        );
      });
    }

    if (sort) {
      const dir = sort.desc ? -1 : 1;
      rows.sort((a, b) => {
        const av = a[sort.id as keyof Receivable];
        const bv = b[sort.id as keyof Receivable];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv), 'pt-BR') * dir;
      });
    }

    return rows;
  }, [allItems, search, filters, sort]);

  const pageRows = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filtered.slice(from, from + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, filters, pageSize]);

  const filterDefs: DataGridFilterDef[] = [
    {
      id: 'status',
      label: 'Situação',
      type: 'select',
      options: [
        { value: 'open', label: 'Em aberto' },
        { value: 'partial', label: 'Parcial' },
        { value: 'due_today', label: 'Vence hoje' },
        { value: 'paid', label: 'Pago' },
        { value: 'overdue', label: 'Vencido' },
        { value: 'cancelled', label: 'Cancelado' },
      ],
    },
    {
      id: 'panel',
      label: 'Painel',
      type: 'select',
      options: [
        { value: 'due-today', label: 'Vencem hoje' },
        { value: 'overdue', label: 'Pagamentos vencidos' },
        { value: 'month', label: 'Receitas do mês' },
      ],
    },
  ];

  const columns: Array<DataGridColumn<Receivable>> = [
    {
      id: 'description',
      header: 'Descrição',
      accessor: 'description',
      sortable: true,
      sticky: true,
      mobilePrimary: true,
      width: 220,
    },
    {
      id: 'amount',
      header: 'Valor',
      sortable: true,
      align: 'right',
      width: 120,
      cell: (r) => r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      id: 'dueDate',
      header: 'Vencimento',
      accessor: 'dueDate',
      sortable: true,
      sticky: true,
      width: 120,
    },
    {
      id: 'status',
      header: 'Situação',
      sortable: true,
      width: 140,
      cell: (r) => {
        const ds = receivableDisplayStatus(String(r.status), r.dueDate, r.displayStatus);
        return <Badge tone={receivableBadgeTone(ds)}>{receivableStatusLabel(ds)}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PaymentModal
        open={!!payTarget}
        accessToken={accessToken}
        receivable={payTarget}
        onClose={() => setPayTarget(null)}
        onSuccess={() => void load()}
      />
      <Form onSubmit={onCreate} data-testid="receivable-create-form">
        <FormSection title="Nova cobrança" description="Recebimento rápido na recepção.">
          <FormRow cols={3}>
            <FormInput
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <CurrencyInput label="Valor" value={amount} onChange={setAmount} />
            <DatePicker label="Vencimento" value={dueDate} onChange={setDueDate} />
          </FormRow>
          <FormActions>
            <Button type="submit" loading={saving} loadingLabel="Criando…">
              Criar cobrança
            </Button>
          </FormActions>
        </FormSection>
      </Form>

      <MovvoDataGrid<Receivable>
        tableId={TABLE_ID}
        columns={columns}
        rows={pageRows}
        total={filtered.length}
        loading={loading || !prefs.ready}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        filterDefs={filterDefs}
        onFiltersChange={(v) => {
          const next = { ...v };
          if (next.status && next.panel) delete next.panel;
          setFilters(next);
        }}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          prefs.onPreferencesChange({ sort: s });
        }}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        getRowId={(r) => r.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        virtualize
        workPanels={WORK_PANELS}
        preferences={prefs.preferences}
        onPreferencesChange={prefs.onPreferencesChange}
        savedFilters={prefs.savedFilters.map((f) => ({
          id: f.id,
          name: f.name,
          filters: f.filters,
          search: f.search,
          sort: f.sort,
        }))}
        onSaveFilter={(name) => {
          void prefs
            .saveFilter(name, filters, search, sort)
            .then(() => push('Filtro salvo.'))
            .catch((e) => push(e instanceof Error ? e.message : 'Falha', 'error'));
        }}
        onApplySavedFilter={(f) => {
          setFilters(f.filters || {});
          setSearch(f.search || '');
          if (f.sort) setSort(f.sort);
        }}
        onDeleteSavedFilter={(id) => {
          void prefs.deleteFilter(id).catch((e) => push(String(e), 'error'));
        }}
        exportSlot={<ExportButtons accessToken={accessToken} resource="receivables" />}
        emptyTitle="Nenhuma cobrança encontrada"
        emptyDescription="Crie uma cobrança ou limpe os filtros (Esc)."
        bulkActions={[
          {
            id: 'receive',
            label: 'Receber selecionados',
            onClick: (ids) => {
              const first = allItems.find(
                (r) => ids.includes(r.id) && isReceivableOpen(String(r.status)),
              );
              if (first) setPayTarget(first);
              else push('Nenhuma cobrança aberta selecionada.', 'error');
            },
          },
        ]}
        rowActions={[
          {
            id: 'receive',
            label: 'Receber',
            hidden: (r) => !isReceivableOpen(String(r.status)),
            onClick: (r) => setPayTarget(r),
          },
          {
            id: 'pix',
            label: 'Gerar PIX',
            hidden: (r) => !isReceivableOpen(String(r.status)),
            onClick: (r) => {
              void financeApi
                .pix(accessToken, r.id)
                .then((tx) => {
                  push(`PIX: ${tx.copyPaste?.slice(0, 40)}…`);
                  return load();
                })
                .catch((e) => push(String(e), 'error'));
            },
          },
          {
            id: 'cancel',
            label: 'Cancelar',
            danger: true,
            hidden: (r) => !isReceivableOpen(String(r.status)),
            onClick: (r) => void financeApi.cancel(accessToken, r.id).then(load),
          },
          {
            id: 'refund',
            label: 'Estornar',
            hidden: (r) => r.status !== 'paid',
            onClick: (r) => void financeApi.refund(accessToken, r.id).then(load),
          },
        ]}
      />
    </div>
  );
}
