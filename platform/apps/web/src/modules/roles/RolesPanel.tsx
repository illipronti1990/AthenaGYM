'use client';

import { useEffect, useState } from 'react';
import type { Role } from '@athenas/shared';
import { apiListRoles } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function RolesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRoles(await apiListRoles(accessToken));
      } catch (err) {
        push(err instanceof Error ? err.message : 'Falha ao carregar cargos', 'error');
        setRoles([]);
      }
    })();
  }, [accessToken, push]);

  if (!roles) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      {roles.map((r) => (
        <article key={r.id} className="rounded border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold">
            {r.name}{' '}
            <span className="text-xs font-normal text-zinc-500">({r.slug})</span>
          </h3>
          <p className="mt-1 text-sm text-zinc-600">{r.description || '—'}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {(r.permissions || []).map((p) => p.code).join(' · ') || 'Sem permissions'}
          </p>
        </article>
      ))}
    </div>
  );
}
