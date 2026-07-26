'use client';

import { Button } from '../Button';
import type { DataGridFilterDef, SavedFilterItem } from './types';

export function DataGridFilters({
  open,
  defs,
  values,
  onChange,
  savedFilters,
  onSave,
  onApplySaved,
  onDeleteSaved,
}: {
  open: boolean;
  defs: DataGridFilterDef[];
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  savedFilters?: SavedFilterItem[];
  onSave?: (name: string) => void;
  onApplySaved?: (filter: SavedFilterItem) => void;
  onDeleteSaved?: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="athena-dg-filters" data-testid="datagrid-filters">
      <div className="athena-dg-filters-grid">
        {defs.map((def) => (
          <label key={def.id} className="athena-field">
            <span className="athena-label">{def.label}</span>
            {def.type === 'select' ? (
              <select
                className="athena-input"
                value={values[def.id] || ''}
                onChange={(e) => onChange({ ...values, [def.id]: e.target.value })}
              >
                <option value="">Todos</option>
                {(def.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="athena-input"
                value={values[def.id] || ''}
                placeholder={def.placeholder}
                onChange={(e) => onChange({ ...values, [def.id]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>

      {onSave ? (
        <div className="athena-dg-saved-row">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const name = window.prompt('Nome do filtro salvo');
              if (name?.trim()) onSave(name.trim());
            }}
          >
            ⭐ Salvar filtro
          </Button>
        </div>
      ) : null}

      {savedFilters && savedFilters.length > 0 ? (
        <div className="athena-dg-saved-list" data-testid="saved-filters">
          {savedFilters.map((f) => (
            <div key={f.id} className="athena-dg-saved-item">
              <button type="button" onClick={() => onApplySaved?.(f)}>
                ⭐ {f.name}
              </button>
              {onDeleteSaved ? (
                <button type="button" className="text-[var(--muted)]" onClick={() => onDeleteSaved(f.id)}>
                  Remover
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
