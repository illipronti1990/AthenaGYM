'use client';

import { useEffect, useState } from 'react';
import type { TimelineEvent } from '@athena/shared';
import { polishApi } from '../services/polishApi';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';

export function EntityTimeline({
  accessToken,
  entity,
  id,
}: {
  accessToken: string;
  entity: string;
  id: string;
}) {
  const [items, setItems] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await polishApi.timeline(accessToken, entity, id));
      } catch {
        setItems([]);
      }
    })();
  }, [accessToken, entity, id]);

  if (!items) return <TableSkeleton rows={4} />;
  if (items.length === 0) {
    return <EmptyState title="Sem histórico" description="Ainda não há eventos registrados." />;
  }

  return (
    <ol className="space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-700">
      {items.map((ev) => (
        <li key={ev.id} className="relative text-sm">
          <span className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full bg-[#A3001B]" />
          <p className="font-medium">
            {ev.module}.{ev.action}
          </p>
          <p className="text-xs text-zinc-500">
            {new Date(ev.createdAt).toLocaleString('pt-BR')}
          </p>
        </li>
      ))}
    </ol>
  );
}
