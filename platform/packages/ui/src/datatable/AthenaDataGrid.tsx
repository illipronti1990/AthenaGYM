'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { SkeletonTable } from '../loading/skeletons';
import { Button } from '../Button';
import { DataGridToolbar } from './DataGridToolbar';
import { DataGridFilters } from './DataGridFilters';
import { ColumnSelector } from './ColumnSelector';
import { Pagination } from './Pagination';
import { BulkActions } from './BulkActions';
import { RowMenu } from './RowMenu';
import { WorkPanels } from './WorkPanels';
import { MobileCardView } from './MobileCardView';
import type {
  DataGridBulkAction,
  DataGridColumn,
  DataGridFilterDef,
  DataGridRowAction,
  DataGridSort,
  SavedFilterItem,
  TablePreferencesState,
  WorkPanel,
} from './types';

const ROW_H = 48;

function cellValue<T>(col: DataGridColumn<T>, row: T): ReactNode {
  if (col.cell) return col.cell(row);
  if (typeof col.accessor === 'function') return String(col.accessor(row) ?? '—');
  if (col.accessor) return String(row[col.accessor] ?? '—');
  return '—';
}

export function AthenaDataGrid<T>({
  tableId,
  columns,
  rows,
  total,
  loading,
  search,
  onSearchChange,
  filters = {},
  filterDefs = [],
  onFiltersChange,
  sort = null,
  onSortChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  getRowId,
  selectedIds,
  onSelectionChange,
  bulkActions = [],
  rowActions = [],
  onRowOpen,
  exportSlot,
  primaryAction,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  emptyAction,
  workPanels = [],
  savedFilters = [],
  onSaveFilter,
  onApplySavedFilter,
  onDeleteSavedFilter,
  preferences,
  onPreferencesChange,
  virtualize = false,
}: {
  tableId: string;
  columns: Array<DataGridColumn<T>>;
  rows: T[];
  total: number;
  loading?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  filters?: Record<string, string>;
  filterDefs?: DataGridFilterDef[];
  onFiltersChange?: (v: Record<string, string>) => void;
  sort?: DataGridSort | null;
  onSortChange?: (s: DataGridSort | null) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  getRowId: (row: T) => string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: DataGridBulkAction[];
  rowActions?: Array<DataGridRowAction<T>>;
  onRowOpen?: (row: T) => void;
  exportSlot?: ReactNode;
  primaryAction?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  workPanels?: WorkPanel[];
  savedFilters?: SavedFilterItem[];
  onSaveFilter?: (name: string) => void;
  onApplySavedFilter?: (f: SavedFilterItem) => void;
  onDeleteSavedFilter?: (id: string) => void;
  preferences?: Partial<TablePreferencesState>;
  onPreferencesChange?: (patch: Partial<TablePreferencesState>) => void;
  virtualize?: boolean;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastChecked = useRef<string | null>(null);

  const defaultVisible = useMemo(
    () => columns.filter((c) => c.defaultVisible !== false).map((c) => c.id),
    [columns],
  );
  const visibleIds = preferences?.columns?.length ? preferences.columns : defaultVisible;
  const widths = preferences?.columnWidths || {};

  const visibleCols = useMemo(() => {
    const order = preferences?.columnOrder?.length
      ? preferences.columnOrder
      : columns.map((c) => c.id);
    return order
      .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is DataGridColumn<T> => Boolean(c && visibleIds.includes(c.id)));
  }, [columns, preferences?.columnOrder, visibleIds]);

  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-testid="datagrid-search"]')?.focus();
      }
      if (e.key === 'Escape') {
        onSearchChange('');
        onFiltersChange?.({});
        setActivePanel(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFiltersChange, onSearchChange]);

  const persist = useCallback(
    (patch: Partial<TablePreferencesState>) => onPreferencesChange?.(patch),
    [onPreferencesChange],
  );

  function toggleSort(col: DataGridColumn<T>) {
    if (!col.sortable || !onSortChange) return;
    if (!sort || sort.id !== col.id) onSortChange({ id: col.id, desc: false });
    else if (!sort.desc) onSortChange({ id: col.id, desc: true });
    else onSortChange(null);
    persist({
      sort:
        !sort || sort.id !== col.id
          ? { id: col.id, desc: false }
          : !sort.desc
            ? { id: col.id, desc: true }
            : null,
    });
  }

  function toggleRow(id: string, shiftKey: boolean) {
    if (!onSelectionChange) return;
    const ids = [...(selectedIds || [])];
    if (shiftKey && lastChecked.current) {
      const all = rows.map(getRowId);
      const a = all.indexOf(lastChecked.current);
      const b = all.indexOf(id);
      if (a >= 0 && b >= 0) {
        const [from, to] = a < b ? [a, b] : [b, a];
        const range = all.slice(from, to + 1);
        onSelectionChange(Array.from(new Set([...ids, ...range])));
        lastChecked.current = id;
        return;
      }
    }
    lastChecked.current = id;
    onSelectionChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function toggleAll() {
    if (!onSelectionChange) return;
    const all = rows.map(getRowId);
    const allSelected = all.every((id) => selectedSet.has(id));
    onSelectionChange(allSelected ? [] : all);
  }

  const chips = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([id, value]) => {
      const def = filterDefs.find((d) => d.id === id);
      const opt = def?.options?.find((o) => o.value === value);
      return {
        id,
        label: `${def?.label || id}: ${opt?.label || value}`,
        onRemove: () => onFiltersChange?.({ ...filters, [id]: '' }),
      };
    });

  const useVirtual = virtualize && rows.length > 40 && !isMobile;
  const viewportH = 420;
  const start = useVirtual ? Math.max(0, Math.floor(scrollTop / ROW_H) - 5) : 0;
  const visibleCount = useVirtual ? Math.ceil(viewportH / ROW_H) + 10 : rows.length;
  const slice = useVirtual ? rows.slice(start, start + visibleCount) : rows;
  const padTop = useVirtual ? start * ROW_H : 0;
  const padBottom = useVirtual ? Math.max(0, (rows.length - start - slice.length) * ROW_H) : 0;

  return (
    <div className="athena-dg" data-testid={`datagrid-${tableId}`}>
      <WorkPanels
        panels={workPanels}
        activeId={activePanel}
        onSelect={(panel) => {
          if (!panel) {
            setActivePanel(null);
            onFiltersChange?.({});
            onSearchChange('');
            return;
          }
          setActivePanel(panel.id);
          onFiltersChange?.(panel.filters || {});
          if (panel.search != null) onSearchChange(panel.search);
        }}
      />

      <DataGridToolbar
        search={search}
        onSearchChange={onSearchChange}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        filtersOpen={filtersOpen}
        onToggleColumns={() => setColumnsOpen((v) => !v)}
        exportSlot={exportSlot}
        primaryAction={primaryAction}
        resultCount={total}
        activeFilterChips={chips}
        onClearFilters={() => {
          onFiltersChange?.({});
          setActivePanel(null);
        }}
      />

      <DataGridFilters
        open={filtersOpen}
        defs={filterDefs}
        values={filters}
        onChange={(v) => {
          setActivePanel(null);
          onFiltersChange?.(v);
        }}
        savedFilters={savedFilters}
        onSave={onSaveFilter}
        onApplySaved={(f) => {
          setActivePanel(null);
          onApplySavedFilter?.(f);
        }}
        onDeleteSaved={onDeleteSavedFilter}
      />

      <ColumnSelector
        open={columnsOpen}
        columns={columns}
        visibleIds={visibleIds}
        onChange={(ids) => persist({ columns: ids })}
      />

      {onSelectionChange ? (
        <BulkActions
          selectedCount={selectedSet.size}
          actions={bulkActions}
          selectedIds={[...selectedSet]}
        />
      ) : null}

      {loading ? (
        <SkeletonTable rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : isMobile ? (
        <MobileCardView
          rows={rows}
          columns={visibleCols}
          getRowId={getRowId}
          selectedIds={selectedSet}
          onToggle={(id) => toggleRow(id, false)}
          onOpen={onRowOpen}
          rowActions={rowActions}
          renderValue={cellValue}
        />
      ) : (
        <div
          ref={bodyRef}
          className="athena-dg-table-wrap"
          style={useVirtual ? { maxHeight: viewportH, overflow: 'auto' } : undefined}
          onScroll={
            useVirtual
              ? (e) => setScrollTop((e.target as HTMLDivElement).scrollTop)
              : undefined
          }
        >
          <table className="athena-dg-table">
            <thead>
              <tr>
                {onSelectionChange ? (
                  <th className="athena-dg-check">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => selectedSet.has(getRowId(r)))}
                      onChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
                ) : null}
                {visibleCols.map((col) => (
                  <th
                    key={col.id}
                    className={`${col.sticky ? 'is-sticky' : ''} ${col.sortable ? 'is-sortable' : ''}`}
                    style={{
                      width: widths[col.id] || col.width,
                      minWidth: col.minWidth || 100,
                    }}
                    onClick={() => toggleSort(col)}
                  >
                    <span className="athena-dg-th">
                      {col.header}
                      {col.sortable ? (
                        sort?.id === col.id ? (
                          sort.desc ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUp size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )
                      ) : null}
                    </span>
                    <span
                      className="athena-dg-resize"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startW = widths[col.id] || col.width || 140;
                        function move(ev: MouseEvent) {
                          const next = Math.max(80, startW + (ev.clientX - startX));
                          persist({ columnWidths: { ...widths, [col.id]: next } });
                        }
                        function up() {
                          window.removeEventListener('mousemove', move);
                          window.removeEventListener('mouseup', up);
                        }
                        window.addEventListener('mousemove', move);
                        window.addEventListener('mouseup', up);
                      }}
                    />
                  </th>
                ))}
                {rowActions.length ? <th className="athena-dg-actions-col">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {padTop > 0 ? (
                <tr aria-hidden>
                  <td style={{ height: padTop, padding: 0, border: 0 }} colSpan={99} />
                </tr>
              ) : null}
              {slice.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className={selectedSet.has(id) ? 'is-selected' : ''}
                    onDoubleClick={() => onRowOpen?.(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onRowOpen?.(row);
                    }}
                    tabIndex={0}
                  >
                    {onSelectionChange ? (
                      <td className="athena-dg-check">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(id)}
                          onChange={(e) =>
                            toggleRow(id, (e.nativeEvent as MouseEvent).shiftKey)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    ) : null}
                    {visibleCols.map((col) => (
                      <td
                        key={col.id}
                        className={col.sticky ? 'is-sticky' : ''}
                        style={{
                          width: widths[col.id] || col.width,
                          textAlign: col.align || 'left',
                        }}
                        onClick={() => onRowOpen?.(row)}
                      >
                        {cellValue(col, row)}
                      </td>
                    ))}
                    {rowActions.length ? (
                      <td className="athena-dg-actions-col">
                        <RowMenu row={row} actions={rowActions} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {padBottom > 0 ? (
                <tr aria-hidden>
                  <td style={{ height: padBottom, padding: 0, border: 0 }} colSpan={99} />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={(s) => {
            onPageSizeChange(s);
            persist({ pageSize: s });
            onPageChange(1);
          }}
        />
      ) : null}

      {!loading && rows.length > 0 && emptyAction ? (
        <div className="mt-2 hidden">
          <Button type="button">{emptyAction}</Button>
        </div>
      ) : null}
    </div>
  );
}
