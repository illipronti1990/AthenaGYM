'use client';

import { Button } from '../Button';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { useState } from 'react';
import type { DataGridBulkAction } from './types';

export function BulkActions({
  selectedCount,
  actions,
  selectedIds,
}: {
  selectedCount: number;
  actions: DataGridBulkAction[];
  selectedIds: string[];
}) {
  const [pending, setPending] = useState<DataGridBulkAction | null>(null);
  if (!selectedCount || !actions.length) return null;

  return (
    <>
      <div className="athena-dg-bulk" data-testid="bulk-actions">
        <span className="text-sm">{selectedCount} selecionado(s)</span>
        {actions.map((a) => (
          <Button
            key={a.id}
            type="button"
            size="sm"
            variant={a.danger ? 'danger' : 'secondary'}
            onClick={() => {
              if (a.danger) setPending(a);
              else a.onClick(selectedIds);
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? `${pending.label}?` : ''}
        message={`Essa ação será aplicada a ${selectedCount} registro(s) e pode não poder ser desfeita.`}
        confirmLabel={pending?.label || 'Confirmar'}
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          pending?.onClick(selectedIds);
          setPending(null);
        }}
      />
    </>
  );
}
