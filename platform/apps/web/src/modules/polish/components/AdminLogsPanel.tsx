'use client';

import { useEffect, useState } from 'react';
import type { AuditLogItem } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { polishApi } from '../services/polishApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export function AdminLogsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<AuditLogItem[] | null>(null);
  const [module, setModule] = useState('');

  async function load() {
    setItems(null);
    try {
      const qs = new URLSearchParams({ pageSize: '50' });
      if (module) qs.set('module', module);
      const res = await polishApi.logs(accessToken, qs.toString());
      setItems(res.items);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, module]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="movvo-input max-w-xs"
          placeholder="Filtrar módulo"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Atualizar
        </Button>
      </div>
      {!items ? (
        <TableSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum log" />
      ) : (
        <div className="movvo-list overflow-x-auto">
          <table className="movvo-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Entidade</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td>{l.module}</td>
                  <td>{l.action}</td>
                  <td>
                    {l.entity || '—'} {l.entityId ? `(${l.entityId.slice(0, 8)})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
