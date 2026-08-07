'use client';

import { useEffect, useState } from 'react';
import type { ClassEnrollment, Schedule } from '@movvo/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function AttendanceRoll({ accessToken }: { accessToken: string }) {
  const [classes, setClasses] = useState<Schedule[]>([]);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  useEffect(() => { operationsApi.schedules(accessToken, { type: 'class', from: new Date().toISOString() }).then(setClasses); }, [accessToken]);
  async function open(item: Schedule) { setSelected(item); setEnrollments(await operationsApi.enrollments(accessToken, item.id)); }
  async function mark(enrollmentId: string, status: 'checked_in' | 'no_show' | 'reserved') {
    await operationsApi.attendance(accessToken, selected!.id, [{ enrollmentId, status }]);
    setEnrollments(await operationsApi.enrollments(accessToken, selected!.id));
  }
  return <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]"><div className="space-y-2">{classes.map((item) => <button key={item.id} className="block w-full rounded border border-[var(--border)] p-3 text-left" onClick={() => open(item)}>{new Date(item.startAt).toLocaleString('pt-BR')} · {item.title}</button>)}</div><div>{selected ? <><h3 className="mb-3 font-semibold">{selected.title}</h3>{enrollments.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-[var(--border)] py-2 text-sm"><span>{item.studentId}</span><div className="flex gap-2"><button className="movvo-btn movvo-btn-secondary" onClick={() => mark(item.id, 'checked_in')}>Presente</button><button className="movvo-btn movvo-btn-secondary" onClick={() => mark(item.id, 'no_show')}>Falta</button></div></div>)}</> : <p className="text-sm text-[var(--muted)]">Selecione uma aula.</p>}</div></div>;
}
