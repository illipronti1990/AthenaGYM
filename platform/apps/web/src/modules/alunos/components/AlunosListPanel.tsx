'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { StudentListItem } from '@movvo/shared';
import { formatCpf, STUDENT_STATUS_LABELS, type StudentStatus } from '@movvo/shared';
import {
  MovvoDataGrid,
  formatCurrencyBRL,
  type DataGridColumn,
  type DataGridFilterDef,
  type DataGridSort,
  type WorkPanel,
} from '@movvo/ui';
import { useToast } from '@/components/ui/Toast';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';
import { useDataGridPrefs } from '@/modules/datagrid/hooks/useDataGridPrefs';
import { deleteAluno, listAlunos } from '../services/alunosApi';
import { AlunoAvatar } from './AlunoAvatar';
import { AlunoStatusBadge } from './AlunoStatus';

const TABLE_ID = 'alunos';

const WORK_PANELS: WorkPanel[] = [
  { id: 'active', label: 'Ativos', tone: 'success', filters: { status: 'active' } },
  { id: 'delinquent', label: 'Inadimplentes', tone: 'danger', filters: { status: 'delinquent' } },
  { id: 'blocked', label: 'Bloqueados', tone: 'warn', filters: { status: 'blocked' } },
  { id: 'leads', label: 'Leads', tone: 'info', filters: { status: 'lead' } },
  { id: 'birthdays', label: 'Aniversariantes', tone: 'info', filters: { birthdays: 'true' } },
  {
    id: 'recent',
    label: 'Matrículas recentes',
    tone: 'success',
    filters: { recentEnrollment: 'true' },
  },
];

function formatDateShort(v: string | null | undefined) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('pt-BR');
}

export function AlunosListPanel({
  accessToken,
  units,
  planOptions = [],
  trainerOptions = [],
}: {
  accessToken: string;
  units: Array<{ id: string; name: string }>;
  planOptions?: string[];
  trainerOptions?: string[];
}) {
  const { push } = useToast();
  const router = useRouter();
  const prefs = useDataGridPrefs(accessToken, TABLE_ID);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<DataGridSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!prefs.ready) return;
    if (prefs.preferences.pageSize) setPageSize(prefs.preferences.pageSize);
    if (prefs.preferences.sort) setSort(prefs.preferences.sort);
  }, [prefs.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!prefs.ready) return;
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await listAlunos(accessToken, {
            q: search || undefined,
            status: filters.status || undefined,
            unitId: filters.unitId || undefined,
            planName: filters.planName || undefined,
            trainerName: filters.trainerName || undefined,
            birthdays: filters.birthdays || undefined,
            recentEnrollment: filters.recentEnrollment || undefined,
            page: String(page),
            pageSize: String(pageSize),
            sort: sort?.id,
            sortDir: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
          });
          setItems(res.items);
          setTotal(res.total);
          setSelectedIds([]);
        } catch (err) {
          push(err instanceof Error ? err.message : 'Falha ao listar alunos', 'error');
          setItems([]);
          setTotal(0);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [accessToken, search, filters, page, pageSize, sort, prefs.ready, push, reloadKey]);

  const filterDefs: DataGridFilterDef[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Situação',
        type: 'select',
        options: Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        id: 'unitId',
        label: 'Unidade',
        type: 'select',
        options: units.map((u) => ({ value: u.id, label: u.name })),
      },
      {
        id: 'planName',
        label: 'Plano',
        type: planOptions.length ? 'select' : 'text',
        options: planOptions.map((p) => ({ value: p, label: p })),
      },
      {
        id: 'trainerName',
        label: 'Professor',
        type: trainerOptions.length ? 'select' : 'text',
        options: trainerOptions.map((t) => ({ value: t, label: t })),
      },
    ],
    [units, planOptions, trainerOptions],
  );

  const columns: Array<DataGridColumn<StudentListItem>> = useMemo(
    () => [
      {
        id: 'photo',
        header: '',
        width: 48,
        minWidth: 48,
        sticky: true,
        cell: (row) => (
          <AlunoAvatar name={row.fullName} photoUrl={row.photoUrl} size={36} />
        ),
      },
      {
        id: 'fullName',
        header: 'Nome',
        accessor: 'fullName',
        sortable: true,
        sticky: true,
        mobilePrimary: true,
        width: 200,
        minWidth: 160,
      },
      {
        id: 'cpf',
        header: 'CPF',
        cell: (row) => formatCpf(row.cpf) || '—',
        sortable: true,
        width: 140,
      },
      {
        id: 'registrationNumber',
        header: 'Matrícula',
        accessor: 'registrationNumber',
        sortable: true,
        width: 130,
      },
      {
        id: 'planName',
        header: 'Plano',
        accessor: 'planName',
        sortable: true,
        width: 140,
        cell: (row) => row.planName || '—',
      },
      {
        id: 'trainerName',
        header: 'Professor',
        accessor: 'trainerName',
        sortable: true,
        width: 140,
        cell: (row) => row.trainerName || '—',
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        sticky: true,
        width: 140,
        cell: (row) => (
          <AlunoStatusBadge status={row.status} displayStatus={row.displayStatus} />
        ),
      },
      {
        id: 'lastCheckinAt',
        header: 'Último check-in',
        sortable: true,
        width: 130,
        cell: (row) => formatDateShort(row.lastCheckinAt || row.lastAccessAt),
      },
      {
        id: 'nextDueDate',
        header: 'Próx. vencimento',
        width: 130,
        cell: (row) => formatDateShort(row.nextDueDate),
      },
      {
        id: 'monthlyFee',
        header: 'Mensalidade',
        width: 120,
        cell: (row) =>
          row.monthlyFee != null ? formatCurrencyBRL(row.monthlyFee) : '—',
      },
      {
        id: 'phone',
        header: 'Telefone',
        accessor: 'phone',
        sortable: true,
        defaultVisible: false,
        width: 140,
        cell: (row) => row.phone || '—',
      },
      {
        id: 'createdAt',
        header: 'Cadastro',
        sortable: true,
        defaultVisible: false,
        width: 120,
        cell: (row) => formatDateShort(row.createdAt),
      },
    ],
    [],
  );

  const unitName = (id: string) => units.find((u) => u.id === id)?.name || id;

  const selectedRows = items.filter((i) => selectedIds.includes(i.id));

  return (
    <div className="space-y-3">
      <MovvoDataGrid<StudentListItem>
        tableId={TABLE_ID}
        columns={columns}
        rows={items}
        total={total}
        loading={loading || !prefs.ready}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filters={filters}
        filterDefs={filterDefs}
        onFiltersChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          setPage(1);
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
            .catch((e) => push(e instanceof Error ? e.message : 'Falha ao salvar filtro', 'error'));
        }}
        onApplySavedFilter={(f) => {
          setFilters(f.filters || {});
          setSearch(f.search || '');
          if (f.sort) setSort(f.sort);
          setPage(1);
        }}
        onDeleteSavedFilter={(id) => {
          void prefs
            .deleteFilter(id)
            .then(() => push('Filtro removido.'))
            .catch((e) => push(e instanceof Error ? e.message : 'Falha', 'error'));
        }}
        onRowOpen={(row) => router.push(`/app/alunos/${row.id}`)}
        exportSlot={<ExportButtons accessToken={accessToken} resource="alunos" />}
        primaryAction={
          <Link
            href="/app/matriculas/nova"
            className="movvo-btn movvo-btn-secondary movvo-btn-sm"
          >
            Matrícula rápida
          </Link>
        }
        emptyTitle={
          search || filters.status || filters.unitId
            ? 'Nenhum aluno com esses filtros'
            : 'Ainda não existem alunos'
        }
        emptyDescription={
          search || filters.status || filters.unitId
            ? 'Ajuste os filtros ou limpe a busca (Esc).'
            : 'Cadastre o primeiro aluno e comece a operar a academia.'
        }
        emptyAction={
          <Link href="/app/alunos/novo" className="movvo-btn movvo-btn-primary">
            Novo aluno
          </Link>
        }
        bulkActions={[
          {
            id: 'whatsapp',
            label: 'WhatsApp (seleção)',
            onClick: () => {
              const withPhone = selectedRows.filter((r) => r.phone || r.whatsapp);
              if (!withPhone.length) {
                push('Nenhum aluno selecionado com telefone.', 'error');
                return;
              }
              const first = withPhone[0];
              const digits = String(first.whatsapp || first.phone || '').replace(/\D/g, '');
              window.open(`https://wa.me/55${digits.replace(/^55/, '')}`, '_blank', 'noopener,noreferrer');
              if (withPhone.length > 1) {
                push(`${withPhone.length} alunos com telefone — abrindo o primeiro.`);
              }
            },
          },
          {
            id: 'export',
            label: 'Exportar seleção',
            onClick: () =>
              push(`${selectedIds.length} aluno(s) — use Exportar CSV/XLSX no topo da lista.`),
          },
          {
            id: 'delete',
            label: 'Excluir',
            danger: true,
            onClick: (ids) => {
              void (async () => {
                try {
                  await Promise.all(ids.map((id) => deleteAluno(accessToken, id)));
                  push(`${ids.length} aluno(s) excluído(s).`);
                  setSelectedIds([]);
                  setPage(1);
                  setReloadKey((k) => k + 1);
                } catch (e) {
                  push(e instanceof Error ? e.message : 'Falha ao excluir', 'error');
                }
              })();
            },
          },
        ]}
        rowActions={[
          {
            id: 'view',
            label: 'Perfil 360°',
            onClick: (row) => router.push(`/app/alunos/${row.id}`),
          },
          {
            id: 'whatsapp',
            label: 'WhatsApp',
            hidden: (row) => !row.phone && !row.whatsapp,
            onClick: (row) => {
              const digits = String(row.whatsapp || row.phone || '').replace(/\D/g, '');
              window.open(`https://wa.me/55${digits.replace(/^55/, '')}`, '_blank', 'noopener,noreferrer');
            },
          },
          {
            id: 'delete',
            label: 'Excluir',
            danger: true,
            onClick: (row) => {
              void deleteAluno(accessToken, row.id)
                .then(() => {
                  push('Aluno excluído.');
                  setReloadKey((k) => k + 1);
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Falha', 'error'));
            },
          },
        ]}
      />

      {filters.unitId ? (
        <p className="sr-only">Unidade filtrada: {unitName(filters.unitId)}</p>
      ) : null}
      {filters.status ? (
        <p className="sr-only">
          Situação:{' '}
          {STUDENT_STATUS_LABELS[filters.status as StudentStatus] || filters.status}
        </p>
      ) : null}
    </div>
  );
}
