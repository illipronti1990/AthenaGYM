'use client';

import type { DashboardChartPoint, DashboardChartPeriod } from '@athena/shared';
import { chartColors, EmptyState } from '@athena/ui';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PERIODS: { id: DashboardChartPeriod; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: '12m', label: '12 meses' },
];

export function RevenueChart({
  data,
  period,
  onPeriod,
}: {
  data: DashboardChartPoint[];
  period: DashboardChartPeriod;
  onPeriod: (p: DashboardChartPeriod) => void;
}) {
  const hasData = data.some((d) => (d.revenue || 0) + (d.expense || 0) > 0);

  return (
    <div className="athena-card h-full min-h-[280px]" data-testid="revenue-chart">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="athena-h3 text-[var(--gold)]">Receita mensal</h3>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={period === p.id ? 'athena-tab athena-tab-active' : 'athena-tab'}
              onClick={() => onPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {!hasData ? (
        <EmptyState title="Sem movimentação financeira" description="Registre recebimentos para ver a evolução." />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Receita"
                stroke={chartColors.revenue}
                fill={chartColors.revenue}
                fillOpacity={0.2}
              />
              <Line type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Lucro" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="goal"
                name="Meta"
                stroke="var(--muted)"
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
