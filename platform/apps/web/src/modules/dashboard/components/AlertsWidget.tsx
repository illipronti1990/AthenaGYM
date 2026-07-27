'use client';

import Link from 'next/link';
import type { DashboardAlert, DashboardAlertSeverity } from '@athena/shared';
import { EmptyState } from '@athena/ui';
import { AlertTriangle } from 'lucide-react';

const severityMeta: Record<
  DashboardAlertSeverity,
  { label: string; className: string; bullet: string }
> = {
  critical: {
    label: 'Crítico',
    className: 'border-red-500/40 text-red-400',
    bullet: '🔴',
  },
  warning: {
    label: 'Atenção',
    className: 'border-orange-500/40 text-orange-400',
    bullet: '🟠',
  },
  info: {
    label: 'Informativo',
    className: 'border-sky-500/40 text-sky-400',
    bullet: '🟢',
  },
};

export function AlertsWidget({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <div className="athena-card h-full" data-testid="alerts-widget">
      <h3 className="athena-h3 mb-3 inline-flex items-center gap-2 text-orange-400">
        <AlertTriangle size={18} /> Atenção
      </h3>
      {alerts.length === 0 ? (
        <EmptyState
          title="Tudo sob controle"
          description="Nenhum alerta crítico no momento."
        />
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const meta = severityMeta[alert.severity];
            const content = (
              <div
                className={`flex items-start gap-2 rounded-[12px] border px-3 py-2 text-sm transition duration-200 ${meta.className}`}
              >
                <span aria-hidden>{meta.bullet}</span>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text)]">{alert.title}</p>
                  <p className="text-xs opacity-80">{meta.label}</p>
                </div>
              </div>
            );
            return (
              <li key={alert.id}>
                {alert.href ? (
                  <Link href={alert.href} className="block cursor-pointer no-underline">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
