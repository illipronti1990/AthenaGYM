'use client';

import { useEffect, useState } from 'react';
import type { Role } from '@movvo/shared';
import { Card } from '@movvo/ui';
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
        <Card key={r.id} hover>
          <h3 className="movvo-title text-base">
            {r.name}{' '}
            <span className="text-xs font-normal text-[var(--muted)]">({r.slug})</span>
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{r.description || '—'}</p>
          <p className="mt-2 text-xs text-[var(--text)]">
            {(r.permissions || []).map((p) => p.code).join(' · ') || 'Sem permissions'}
          </p>
        </Card>
      ))}
    </div>
  );
}
