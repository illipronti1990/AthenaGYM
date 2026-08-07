'use client';

import { useEffect, useState } from 'react';
import type { Schedule } from '@athena/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function TeacherAgenda({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Schedule[]>([]);
  useEffect(() => { operationsApi.teacherAgenda(accessToken).then(setItems); }, [accessToken]);
  return <div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded border border-[var(--border)] p-3"><strong>{new Date(item.startAt).toLocaleString('pt-BR')}</strong> · {item.title}<span className="ml-2 text-xs text-[var(--muted)]">{item.status}</span></div>)}{!items.length ? <p className="text-sm text-[var(--muted)]">Nenhum compromisso atribuído.</p> : null}</div>;
}
