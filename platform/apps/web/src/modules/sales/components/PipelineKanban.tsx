'use client';

import { useEffect, useState } from 'react';
import type { Lead, PipelineColumn } from '@athenas/shared';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function PipelineKanban({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [columns, setColumns] = useState<PipelineColumn[] | null>(null);
  const [dragging, setDragging] = useState<Lead | null>(null);

  async function load() {
    try {
      setColumns(await salesApi.pipeline(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha pipeline', 'error');
      setColumns([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onDrop(stageId: string) {
    if (!dragging) return;
    try {
      await salesApi.moveStage(accessToken, dragging.id, stageId);
      push('Lead movido');
      setDragging(null);
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao mover', 'error');
    }
  }

  if (!columns) return <TableSkeleton rows={6} />;

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" data-testid="sales-pipeline">
      {columns.map((col) => (
        <div
          key={col.stage.id}
          className="min-w-[220px] flex-1 rounded border border-zinc-200 bg-zinc-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => void onDrop(col.stage.id)}
        >
          <div className="border-b border-zinc-200 px-3 py-2 text-sm font-semibold">
            {col.stage.name}{' '}
            <span className="text-zinc-400">({col.leads.length})</span>
          </div>
          <div className="space-y-2 p-2">
            {col.leads.map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => setDragging(lead)}
                className="cursor-grab rounded bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
              >
                <p className="font-medium">{lead.fullName}</p>
                <p className="text-xs text-zinc-500">{lead.phone || lead.email || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
