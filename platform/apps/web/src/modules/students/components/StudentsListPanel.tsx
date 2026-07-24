'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StudentListItem } from '@athenas/shared';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { listStudents } from '../services/studentsApi';
import { StudentCard } from './StudentCard';
import { StudentFilters, type StudentFilterValues } from './StudentFilters';

export function StudentsListPanel({
  accessToken,
  units,
}: {
  accessToken: string;
  units: Array<{ id: string; name: string }>;
}) {
  const { push } = useToast();
  const [filters, setFilters] = useState<StudentFilterValues>({
    q: '',
    status: '',
    unitId: '',
  });
  const [items, setItems] = useState<StudentListItem[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await listStudents(accessToken, {
            q: filters.q || undefined,
            status: filters.status || undefined,
            unitId: filters.unitId || undefined,
            page: '1',
            pageSize: '50',
          });
          setItems(res.items);
          setTotal(res.total);
        } catch (err) {
          push(err instanceof Error ? err.message : 'Falha ao listar alunos', 'error');
          setItems([]);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [accessToken, filters, push]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StudentFilters value={filters} onChange={setFilters} units={units} />
        <Link
          href="/app/students/new"
          className="rounded bg-[#A3001B] px-4 py-2 text-sm font-semibold text-white"
        >
          Novo aluno
        </Link>
      </div>
      <p className="text-xs text-zinc-500">{total} aluno(s)</p>
      {!items ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="overflow-hidden rounded border border-zinc-200 bg-white">
          {items.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
          {!items.length ? (
            <p className="p-6 text-sm text-zinc-500">Nenhum aluno encontrado.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
