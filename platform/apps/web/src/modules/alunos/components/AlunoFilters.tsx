'use client';

import { STUDENT_STATUSES, STUDENT_STATUS_LABELS } from '@movvo/shared';

export type StudentFilterValues = {
  q: string;
  status: string;
  unitId: string;
};

export function AlunoFilters({
  value,
  onChange,
  units,
}: {
  value: StudentFilterValues;
  onChange: (v: StudentFilterValues) => void;
  units: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" data-testid="student-filters">
      <input
        placeholder="Nome, CPF, matrícula…"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className="movvo-input"
        data-testid="student-search"
      />
      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value })}
        className="movvo-input"
      >
        <option value="">Todos os status</option>
        {STUDENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STUDENT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <select
        value={value.unitId}
        onChange={(e) => onChange({ ...value, unitId: e.target.value })}
        className="movvo-input"
      >
        <option value="">Todas as unidades</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export { AlunoFilters as StudentSearch };
