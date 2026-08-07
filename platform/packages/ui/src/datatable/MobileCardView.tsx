'use client';

import type { ReactNode } from 'react';
import type { DataGridColumn, DataGridRowAction } from './types';
import { RowMenu } from './RowMenu';

export function MobileCardView<T>({
  rows,
  columns,
  getRowId,
  selectedIds,
  onToggle,
  onOpen,
  rowActions,
  renderValue,
}: {
  rows: T[];
  columns: Array<DataGridColumn<T>>;
  getRowId: (row: T) => string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpen?: (row: T) => void;
  rowActions?: Array<DataGridRowAction<T>>;
  renderValue: (col: DataGridColumn<T>, row: T) => ReactNode;
}) {
  const primary = columns.find((c) => c.mobilePrimary) || columns[0];
  const rest = columns.filter((c) => c.id !== primary?.id).slice(0, 4);

  return (
    <ul className="movvo-dg-mobile" data-testid="datagrid-mobile">
      {rows.map((row) => {
        const id = getRowId(row);
        return (
          <li key={id} className="movvo-dg-mobile-card">
            <label className="movvo-check">
              <input type="checkbox" checked={selectedIds.has(id)} onChange={() => onToggle(id)} />
            </label>
            <button type="button" className="movvo-dg-mobile-body" onClick={() => onOpen?.(row)}>
              <p className="font-medium text-[var(--text)]">
                {primary ? renderValue(primary, row) : id}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-[var(--muted)]">
                {rest.map((c) => (
                  <p key={c.id}>
                    {c.header}: {renderValue(c, row)}
                  </p>
                ))}
              </div>
            </button>
            {rowActions ? <RowMenu row={row} actions={rowActions} /> : null}
          </li>
        );
      })}
    </ul>
  );
}
