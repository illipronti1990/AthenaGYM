'use client';

import { useEffect, useState } from 'react';
import type { AgendaDashboard, AgendaKpis } from '@athena/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function AgendaDashboard({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<AgendaDashboard | null>(null);
  const [kpis, setKpis] = useState<AgendaKpis | null>(null);
  useEffect(() => { operationsApi.agendaDashboard(accessToken).then(setData); operationsApi.agendaKpis(accessToken).then(setKpis); }, [accessToken]);
  if (!data || !kpis) return <p className="text-sm text-[var(--muted)]">Carregando indicadores…</p>;
  const cards = [['Aulas hoje', data.classesToday], ['Confirmados', data.confirmedToday], ['Ocupação', `${data.occupancyPct}%`], ['Professores em aula', data.teachersInClass], ['Avaliações', data.assessmentsToday], ['Reservas', data.reservationsToday], ['Fila de espera', data.waitlistToday], ['Presença', `${kpis.attendanceRate}%`]];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded border border-[var(--border)] p-4"><p className="text-xs text-[var(--muted)]">{label}</p><strong className="text-2xl">{value}</strong></div>)}</div>;
}
