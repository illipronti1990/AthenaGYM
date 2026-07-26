'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export type ShortcutItem = {
  keys: string;
  description: string;
};

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { keys: 'Ctrl + K', description: 'Pesquisar / command palette' },
  { keys: 'Ctrl + B', description: 'Abrir/fechar sidebar' },
  { keys: 'Ctrl + N', description: 'Novo aluno' },
  { keys: 'Ctrl + S', description: 'Salvar formulário ativo' },
  { keys: 'Esc', description: 'Fechar modal / limpar overlays' },
  { keys: '?', description: 'Abrir esta lista de atalhos' },
  { keys: 'Ctrl + F', description: 'Buscar na tabela (DataGrid)' },
];

export function ShortcutDialog({
  open,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: {
  open: boolean;
  onClose: () => void;
  shortcuts?: ShortcutItem[];
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="athena-shortcut-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="athena-shortcuts-title"
      data-testid="shortcut-dialog"
      onClick={onClose}
    >
      <div className="athena-shortcut-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="athena-shortcut-head">
          <h2 id="athena-shortcuts-title" className="athena-h3">
            Atalhos de teclado
          </h2>
          <button type="button" className="athena-icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <ul className="athena-shortcut-list">
          {shortcuts.map((s) => (
            <li key={s.keys}>
              <kbd className="athena-kbd">{s.keys}</kbd>
              <span>{s.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { DEFAULT_SHORTCUTS };
