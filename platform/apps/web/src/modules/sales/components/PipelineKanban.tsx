'use client';

import { useEffect, useState } from 'react';
import type { Lead, PipelineColumn } from '@athena/shared';
import { Card } from '@athena/ui';
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
          className="min-w-[220px] flex-1 rounded-[16px] border border-[var(--border)] bg-[var(--surface)]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => void onDrop(col.stage.id)}
        >
          <div className="border-b border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--gold)]">
            {col.stage.name}{' '}
            <span className="text-[var(--muted)]">({col.leads.length})</span>
          </div>
          <div className="space-y-2 p-2">
            {col.leads.map((lead) => (
              <Card
                key={lead.id}
                hover
                draggable
                onDragStart={() => setDragging(lead)}
                className="cursor-grab !p-3 active:cursor-grabbing"
              >
                <p className="font-medium text-[var(--text)]">{lead.fullName}</p>
                <p className="text-xs text-[var(--muted)]">{lead.phone || lead.email || '—'}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
