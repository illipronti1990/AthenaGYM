'use client';

import type { ReactNode } from 'react';
import { Search, SlidersHorizontal, Download, Columns3, Printer, X } from 'lucide-react';
import { Button } from '../Button';

export function DataGridToolbar({
  search,
  onSearchChange,
  onToggleFilters,
  filtersOpen,
  onToggleColumns,
  exportSlot,
  primaryAction,
  resultCount,
  activeFilterChips,
  onClearFilters,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  onToggleColumns: () => void;
  exportSlot?: ReactNode;
  primaryAction?: ReactNode;
  resultCount?: number;
  activeFilterChips?: Array<{ id: string; label: string; onRemove: () => void }>;
  onClearFilters?: () => void;
}) {
  return (
    <div className="athena-dg-toolbar" data-testid="datagrid-toolbar">
      <div className="athena-dg-search">
        <Search size={16} aria-hidden />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Pesquisar… (Ctrl+F)"
          aria-label="Pesquisar"
          data-testid="datagrid-search"
        />
        {search ? (
          <button type="button" className="athena-dg-icon-clear" onClick={() => onSearchChange('')} aria-label="Limpar busca">
            <X size={14} />
          </button>
        ) : null}
      </div>
      <div className="athena-dg-toolbar-actions">
        {typeof resultCount === 'number' ? (
          <span className="athena-dg-count">{resultCount} resultado(s)</span>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onToggleFilters}
          aria-pressed={filtersOpen}
        >
          <SlidersHorizontal size={14} /> Filtros
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onToggleColumns}>
          <Columns3 size={14} /> Colunas
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          aria-label="Imprimir tabela"
        >
          <Printer size={14} /> Imprimir
        </Button>
        {exportSlot ? (
          <div className="athena-dg-export">
            <Download size={14} aria-hidden />
            {exportSlot}
          </div>
        ) : null}
        {primaryAction}
      </div>
      {activeFilterChips && activeFilterChips.length > 0 ? (
        <div className="athena-dg-chips">
          {activeFilterChips.map((c) => (
            <button key={c.id} type="button" className="athena-dg-chip" onClick={c.onRemove}>
              {c.label} <X size={12} />
            </button>
          ))}
          {onClearFilters ? (
            <button type="button" className="athena-dg-chip-clear" onClick={onClearFilters}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
