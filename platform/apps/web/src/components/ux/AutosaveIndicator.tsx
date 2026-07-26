'use client';

import type { AutosaveStatus } from '@/hooks/useAutosave';

export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null;
  const label =
    status === 'saving'
      ? 'Salvando…'
      : status === 'saved'
        ? '✔ Alterações salvas'
        : '⚠ Erro ao salvar';
  return (
    <span
      className={`athena-autosave ${status === 'saved' ? 'is-saved' : status === 'saving' ? 'is-saving' : ''}`}
      data-testid="autosave-indicator"
    >
      {label}
    </span>
  );
}
