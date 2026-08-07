'use client';

import { useEffect, useId, useRef, useState } from 'react';

export function capitalizeLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);
}

export const MUSCLE_GROUP_OPTIONS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Posteriores',
  'Core',
  'Cardio',
  'Corpo todo',
] as const;

export function MuscleGroupMultiSelect({
  value,
  onChange,
  options = [...MUSCLE_GROUP_OPTIONS],
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options?: string[];
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function toggle(group: string) {
    const next = capitalizeLabel(group);
    if (value.some((g) => g.toLocaleLowerCase('pt-BR') === next.toLocaleLowerCase('pt-BR'))) {
      onChange(
        value.filter((g) => g.toLocaleLowerCase('pt-BR') !== next.toLocaleLowerCase('pt-BR')),
      );
      return;
    }
    onChange([...value, next]);
  }

  const displayValues = value.map(capitalizeLabel);
  const label =
    displayValues.length === 0
      ? 'Selecione grupos…'
      : displayValues.length <= 2
        ? displayValues.join(', ')
        : `${displayValues.slice(0, 2).join(', ')} +${displayValues.length - 2}`;

  return (
    <div ref={rootRef} className="relative min-w-[220px]">
      <button
        type="button"
        id={id}
        className="movvo-input mt-1 flex w-full items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="muscle-group-combobox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value.length ? '' : 'text-[var(--muted)]'}>{label}</span>
        <span aria-hidden className="text-[var(--gold)]">
          ▾
        </span>
      </button>

      {displayValues.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {displayValues.map((g) => (
            <button
              key={g}
              type="button"
              className="rounded-[8px] border border-[var(--border)] bg-[rgba(212,175,55,0.12)] px-2 py-0.5 text-xs text-[var(--gold)]"
              onClick={() => toggle(g)}
              title="Remover"
              data-testid={`muscle-chip-${g}`}
            >
              {g} ×
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <ul
          role="listbox"
          aria-multiselectable
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
          data-testid="muscle-group-options"
        >
          {options.map((group) => {
            const option = capitalizeLabel(group);
            const selected = value.some(
              (g) => g.toLocaleLowerCase('pt-BR') === option.toLocaleLowerCase('pt-BR'),
            );
            return (
              <li key={option} role="option" aria-selected={selected}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.04)]">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(option)}
                    className="accent-[var(--primary)]"
                    data-testid={`muscle-option-${option}`}
                  />
                  <span>{option}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
