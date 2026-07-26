'use client';

import { useEffect, useState } from 'react';
import type { StudentListItem } from '@athena/shared';
import { listStudents } from '@/modules/students/services/studentsApi';

export function StudentSelect({
  accessToken,
  value,
  onChange,
  required = true,
  className = 'athena-input mt-1 block w-full max-w-md',
}: {
  accessToken: string;
  value: string;
  onChange: (studentId: string) => void;
  required?: boolean;
  className?: string;
}) {
  const [students, setStudents] = useState<StudentListItem[]>([]);

  useEffect(() => {
    void listStudents(accessToken, { pageSize: '100' })
      .then((res) => setStudents(res.items || []))
      .catch(() => setStudents([]));
  }, [accessToken]);

  return (
    <label className="block text-sm text-[var(--muted)]">
      Aluno
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        data-testid="student-select"
      >
        <option value="">Selecione o aluno…</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.fullName}
            {s.registrationNumber ? ` · ${s.registrationNumber}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
