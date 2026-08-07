'use client';

import type { DashboardChartPoint } from '@movvo/shared';
import { chartColors, EmptyState } from '@movvo/ui';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function CheckinChart({ data }: { data: DashboardChartPoint[] }) {
  const hasData = data.some((d) => (d.value || 0) > 0);
  return (
    <div className="movvo-card h-full min-h-[280px]" data-testid="checkin-chart">
      <h3 className="movvo-h3 mb-3 text-[var(--primary)]">Check-ins semanais</h3>
      {!hasData ? (
        <EmptyState title="Nenhum check-in esta semana" description="O gráfico aparece assim que houver acessos." />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="value" name="Check-ins" fill={chartColors.checkins} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
