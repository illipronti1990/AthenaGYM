'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { StudentListItem } from '@athena/shared';
import { formatCpf, STUDENT_STATUS_LABELS, type StudentStatus } from '@athena/shared';
import {
  AthenaDataGrid,
  Button,
  FloatingActionButton,
  type DataGridColumn,
  type DataGridFilterDef,
  type DataGridSort,
  type WorkPanel,
} from '@athena/ui';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';
import { useDataGridPrefs } from '@/modules/datagrid/hooks/useDataGridPrefs';
import { deleteStudent, listStudents } from '../services/studentsApi';
import { StudentStatusBadge } from './StudentStatus';

const TABLE_ID = 'students';

const WORK_PANELS: WorkPanel[] = [
  { id: 'active', label: 'Ativos', tone: 'success', filters: { status: 'active' } },
  { id: 'delinquent', label: 'Inadimplentes', tone: 'danger', filters: { status: 'delinquent' } },
  { id: 'blocked', label: 'Bloqueados', tone: 'warn', filters: { status: 'blocked' } },
  { id: 'leads', label: 'Leads', tone: 'info', filters: { status: 'lead' } },
];

export function StudentsListPanel({
  accessToken,
  units,
}: {
  accessToken: string;
  units: Array<{ id: string; name: string }>;
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
          const res = await listStudents(accessToken, {
            q: search || undefined,
            status: filters.status || undefined,
            unitId: filters.unitId || undefined,
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
    ],
    [units],
  );

  const columns: Array<DataGridColumn<StudentListItem>> = useMemo(
    () => [
      {
        id: 'fullName',
        header: 'Nome',
        accessor: 'fullName',
        sortable: true,
        sticky: true,
        mobilePrimary: true,
        width: 220,
        minWidth: 160,
      },
      {
        id: 'cpf',
        header: 'CPF',
        cell: (row) => formatCpf(row.cpf) || '—',
        sortable: true,
        defaultVisible: false,
        width: 140,
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
        id: 'status',
        header: 'Situação',
        sortable: true,
        sticky: true,
        width: 140,
        cell: (row) => <StudentStatusBadge status={row.status} />,
      },
      {
        id: 'phone',
        header: 'Telefone',
        accessor: 'phone',
        sortable: true,
        width: 140,
        cell: (row) => row.phone || '—',
      },
      {
        id: 'registrationNumber',
        header: 'Código',
        accessor: 'registrationNumber',
        sortable: true,
        defaultVisible: false,
        width: 120,
      },
    ],
    [],
  );

  const unitName = (id: string) => units.find((u) => u.id === id)?.name || id;

  return (
    <div className="space-y-3">
      <FloatingActionButton label="Novo aluno (Ctrl+N)" onClick={() => router.push('/app/students/new')}>
        <Plus size={22} />
      </FloatingActionButton>

      <AthenaDataGrid<StudentListItem>
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
        onRowOpen={(row) => router.push(`/app/students/${row.id}`)}
        exportSlot={<ExportButtons accessToken={accessToken} resource="students" />}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/students/enroll">
              <Button variant="secondary" size="sm">
                Matrícula rápida
              </Button>
            </Link>
            <Link href="/app/students/new">
              <Button size="sm">+ Novo</Button>
            </Link>
          </div>
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
          <Link href="/app/students/new">
            <Button>Novo aluno</Button>
          </Link>
        }
        bulkActions={[
          {
            id: 'export',
            label: 'Exportar seleção',
            onClick: () => push(`${selectedIds.length} aluno(s) selecionado(s) — use Exportar CSV/XLSX.`),
          },
          {
            id: 'delete',
            label: 'Excluir',
            danger: true,
            onClick: (ids) => {
              void (async () => {
                try {
                  await Promise.all(ids.map((id) => deleteStudent(accessToken, id)));
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
            label: 'Visualizar',
            onClick: (row) => router.push(`/app/students/${row.id}`),
          },
          {
            id: 'edit',
            label: 'Editar',
            onClick: (row) => router.push(`/app/students/${row.id}`),
          },
          {
            id: 'whatsapp',
            label: 'WhatsApp',
            hidden: (row) => !row.phone,
            onClick: (row) => {
              const digits = String(row.phone || '').replace(/\D/g, '');
              window.open(`https://wa.me/55${digits}`, '_blank', 'noopener,noreferrer');
            },
          },
          {
            id: 'delete',
            label: 'Excluir',
            danger: true,
            onClick: (row) => {
              void deleteStudent(accessToken, row.id)
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
