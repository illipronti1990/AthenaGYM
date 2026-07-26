'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OpsDashboard, UserFavorite } from '@athena/shared';
import { Button, Card, EmptyState, chartColors } from '@athena/ui';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { settingsApi } from '@/modules/settings/services/settingsApi';
import { polishApi } from '@/modules/polish/services/polishApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const QUICK = [
  { href: '/app/students/new', label: 'Novo aluno' },
  { href: '/app/sales', label: 'Nova matrícula' },
  { href: '/app/finance', label: 'Novo pagamento' },
  { href: '/app/workouts', label: 'Novo treino' },
  { href: '/app/workouts', label: 'Nova avaliação' },
];

const DEFAULT_FAVS = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/finance', label: 'Financeiro' },
  { href: '/app/students', label: 'Alunos' },
  { href: '/app/operations', label: 'Agenda' },
  { href: '/app/workouts', label: 'Treinos' },
];

export function OpsDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<OpsDashboard | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [dash, favs] = await Promise.all([
          settingsApi.dashboard(accessToken),
          polishApi.favorites(accessToken).catch(() => [] as UserFavorite[]),
        ]);
        setData(dash);
        setFavorites(favs);
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha no dashboard', 'error');
        setData({
          checkinsToday: 0,
          newStudentsToday: 0,
          receivablesDueSoon: 0,
          receivablesOverdue: 0,
          cashToday: 0,
          agendaToday: 0,
          upcomingAssessments: 0,
          birthdaysSoon: [],
          revenueLast30Days: [],
          checkinsByDay: [],
          newStudentsByDay: [],
          delinquencyRate: 0,
          monthlyEvolution: [],
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function toggleFavorite(href: string, label: string) {
    const existing = favorites.find((f) => f.href === href);
    try {
      if (existing) {
        await polishApi.removeFavorite(accessToken, existing.id);
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        push('Removido dos favoritos');
      } else {
        const created = await polishApi.addFavorite(accessToken, { href, label });
        setFavorites((prev) => [...prev, created]);
        push('Adicionado aos favoritos');
      }
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha nos favoritos', 'error');
    }
  }

  if (!data) return <TableSkeleton rows={6} />;

  const cards = [
    { label: 'Check-ins hoje', value: String(data.checkinsToday) },
    { label: 'Novos alunos', value: String(data.newStudentsToday) },
    { label: 'Mensalidades vencendo', value: String(data.receivablesDueSoon) },
    { label: 'Mensalidades vencidas', value: String(data.receivablesOverdue) },
    { label: 'Caixa hoje', value: money(data.cashToday) },
    { label: 'Agenda hoje', value: String(data.agendaToday) },
    { label: 'Próximas avaliações', value: String(data.upcomingAssessments) },
    { label: 'Inadimplência', value: `${data.delinquencyRate}%` },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="athena-title mb-3 text-sm uppercase tracking-wide">Ações rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <Link key={q.label} href={q.href}>
              <Button>+ {q.label}</Button>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="athena-title mb-3 text-sm uppercase tracking-wide">Favoritos</h2>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_FAVS.map((f) => {
            const starred = favorites.some((x) => x.href === f.href);
            return (
              <Button
                key={f.href}
                type="button"
                variant={starred ? 'primary' : 'secondary'}
                onClick={() => void toggleFavorite(f.href, f.label)}
              >
                {starred ? '★' : '☆'} {f.label}
              </Button>
            );
          })}
          {favorites
            .filter((f) => !DEFAULT_FAVS.some((d) => d.href === f.href))
            .map((f) => (
              <Link key={f.id} href={f.href}>
                <Button variant="secondary">★ {f.label}</Button>
              </Link>
            ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} hover>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{c.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receita — 30 dias">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueLast30Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2B2B" />
              <XAxis dataKey="date" hide />
              <YAxis width={40} stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#1B1B1F', border: '1px solid #2B2B2B', borderRadius: 10 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors.revenue}
                fill={`${chartColors.revenue}33`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Check-ins por dia">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.checkinsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2B2B" />
              <XAxis dataKey="date" hide />
              <YAxis width={30} stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#1B1B1F', border: '1px solid #2B2B2B', borderRadius: 10 }}
              />
              <Bar dataKey="value" fill={chartColors.checkins} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Novos alunos">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.newStudentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2B2B" />
              <XAxis dataKey="date" hide />
              <YAxis width={30} stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#1B1B1F', border: '1px solid #2B2B2B', borderRadius: 10 }}
              />
              <Bar dataKey="value" fill={chartColors.workouts} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Evolução mensal">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2B2B" />
              <XAxis dataKey="date" stroke="#A1A1AA" />
              <YAxis width={40} stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#1B1B1F', border: '1px solid #2B2B2B', borderRadius: 10 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors.finance}
                fill={`${chartColors.finance}33`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section>
        <h2 className="athena-title mb-3 text-sm uppercase tracking-wide">
          Próximos aniversariantes
        </h2>
        {data.birthdaysSoon.length === 0 ? (
          <EmptyState title="Nenhum aniversário nos próximos 14 dias" />
        ) : (
          <Card>
            <ul className="divide-y divide-[var(--border)]">
              {data.birthdaysSoon.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/app/students/${b.id}`} className="athena-link">
                    {b.fullName}
                  </Link>
                  <span className="text-[var(--muted)]">
                    {b.daysUntil === 0 ? 'Hoje' : `em ${b.daysUntil} dia(s)`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <p className="athena-title mb-2 text-sm">{title}</p>
      {children}
    </Card>
  );
}
