'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StudentListItem } from '@athena/shared';
import { Button, EmptyState, FloatingActionButton } from '@athena/ui';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { listStudents } from '../services/studentsApi';
import { StudentCard } from './StudentCard';
import { StudentFilters, type StudentFilterValues } from './StudentFilters';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';

export function StudentsListPanel({
  accessToken,
  units,
}: {
  accessToken: string;
  units: Array<{ id: string; name: string }>;
}) {
  const { push } = useToast();
  const router = useRouter();
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

  const hasFilters = Boolean(filters.q || filters.status || filters.unitId);

  return (
    <div className="space-y-4">
      <FloatingActionButton label="Novo aluno (Ctrl+N)" onClick={() => router.push('/app/students/new')}>
        <Plus size={22} />
      </FloatingActionButton>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StudentFilters value={filters} onChange={setFilters} units={units} />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons accessToken={accessToken} resource="students" />
          <Link href="/app/students/new">
            <Button>Novo aluno</Button>
          </Link>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)]">{total} aluno(s)</p>
      {!items ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="athena-list">
          {items.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
          {!items.length ? (
            <EmptyState
              title={hasFilters ? 'Nenhum aluno com esses filtros' : 'Ainda não existem alunos'}
              description={
                hasFilters
                  ? 'Ajuste os filtros ou limpe a busca para ver todos.'
                  : 'Cadastre o primeiro aluno e comece a operar a academia.'
              }
              icon={<Users size={40} strokeWidth={1.5} />}
              action={
                <Link href="/app/students/new">
                  <Button>Novo aluno</Button>
                </Link>
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
