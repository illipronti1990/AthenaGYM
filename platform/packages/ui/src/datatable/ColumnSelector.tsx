'use client';

import type { DataGridColumn } from './types';

export function ColumnSelector<T>({
  open,
  columns,
  visibleIds,
  onChange,
}: {
  open: boolean;
  columns: Array<DataGridColumn<T>>;
  visibleIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!open) return null;
  return (
    <div className="athena-dg-columns" data-testid="column-selector">
      <p className="athena-caption mb-2">Colunas visíveis</p>
      <ul className="space-y-1">
        {columns.map((col) => {
          const checked = visibleIds.includes(col.id);
          return (
            <li key={col.id}>
              <label className="athena-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked && visibleIds.length <= 1) return;
                    onChange(
                      checked ? visibleIds.filter((id) => id !== col.id) : [...visibleIds, col.id],
                    );
                  }}
                />
                <span>{col.header}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
