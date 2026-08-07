'use client';

import type { WorkPanel } from './types';

const toneClass: Record<NonNullable<WorkPanel['tone']>, string> = {
  default: '',
  danger: 'is-danger',
  success: 'is-success',
  warn: 'is-warn',
  info: 'is-info',
};

export function WorkPanels({
  panels,
  activeId,
  onSelect,
}: {
  panels: WorkPanel[];
  activeId?: string | null;
  onSelect: (panel: WorkPanel | null) => void;
}) {
  if (!panels.length) return null;
  return (
    <div className="movvo-dg-panels" data-testid="work-panels">
      <button
        type="button"
        className={`movvo-dg-panel ${!activeId ? 'is-active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Todos
      </button>
      {panels.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`movvo-dg-panel ${toneClass[p.tone || 'default']} ${activeId === p.id ? 'is-active' : ''}`}
          onClick={() => onSelect(p)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
