'use client';

import { Button } from '../Button';

const SIZES = [20, 50, 100, 200] as const;

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="movvo-dg-pagination" data-testid="datagrid-pagination">
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ←
        </Button>
        <span className="text-sm text-[var(--muted)]">
          Página {page} de {pages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          →
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        Registros
        <select
          className="movvo-input w-auto"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
