'use client';

export type FormAutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AutoSaveIndicator({ status }: { status: FormAutosaveStatus }) {
  if (status === 'idle') return null;
  const label =
    status === 'saving'
      ? 'Salvando…'
      : status === 'saved'
        ? '✔ Alterações salvas automaticamente'
        : '⚠ Erro ao salvar';
  return (
    <span
      className={`athena-autosave ${status === 'saved' ? 'is-saved' : status === 'saving' ? 'is-saving' : ''}`}
      data-testid="form-autosave"
    >
      {label}
    </span>
  );
}
