'use client';

import { useEffect, useState } from 'react';
import type { Schedule } from '@movvo/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function BookingBoard({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Schedule[]>([]);
  useEffect(() => { operationsApi.schedules(accessToken, { from: new Date().toISOString() }).then(setItems); }, [accessToken]);
  return <div className="space-y-3">{items.filter((item) => item.type === 'class').map((item) => <article key={item.id} className="rounded border border-[var(--border)] p-4"><div className="flex justify-between"><strong>{item.title}</strong><span>{item.reservedCount ?? 0}/{item.maxCapacity}</span></div><p className="text-sm text-[var(--muted)]">{new Date(item.startAt).toLocaleString('pt-BR')} · fila {item.waitlistCount ?? 0}</p><div className="mt-2 h-2 rounded bg-[var(--border)]"><div className="h-2 rounded bg-[var(--gold)]" style={{ width: `${Math.min(100, ((item.reservedCount ?? 0) / item.maxCapacity) * 100)}%` }} /></div></article>)}{!items.length ? <p className="text-sm text-[var(--muted)]">Nenhuma reserva futura.</p> : null}</div>;
}
