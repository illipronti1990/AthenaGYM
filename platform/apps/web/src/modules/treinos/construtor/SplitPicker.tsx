'use client';

import { SPLIT_TYPES, type WorkoutSplitType } from '@athena/shared';

const LABELS: Record<string, string> = {
  A: 'Dia A',
  B: 'Dia B',
  C: 'Dia C',
  D: 'Dia D',
  E: 'Dia E',
  ABC: 'ABC',
  ABCD: 'ABCD',
  ABCDE: 'ABCDE',
  full_body: 'Full body',
  upper_lower: 'Upper/Lower',
  custom: 'Custom',
};

export function SplitPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: WorkoutSplitType) => void;
}) {
  return (
    <label className="text-sm text-[var(--muted)]" data-testid="split-picker">
      Divisão
      <select
        className="mt-1 block athena-input"
        value={value}
        onChange={(e) => onChange(e.target.value as WorkoutSplitType)}
      >
        {SPLIT_TYPES.map((s) => (
          <option key={s} value={s}>
            {LABELS[s] || s}
          </option>
        ))}
      </select>
    </label>
  );
}
