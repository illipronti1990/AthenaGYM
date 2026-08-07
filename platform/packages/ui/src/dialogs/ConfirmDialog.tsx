'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Button } from '../Button';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="movvo-dialog-overlay" />
        <RadixDialog.Content className="movvo-dialog-content" aria-describedby={undefined}>
          <RadixDialog.Title className="movvo-h3 text-[var(--gold)]">{title}</RadixDialog.Title>
          <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={danger ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={loading}
              loadingLabel="Processando…"
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
