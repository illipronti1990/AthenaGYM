import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ExecutiveStrip, KpiGrid } from '@/modules/analytics/components/AnalyticsPanels';

const links = [
  ['Executivo', '/app/analytics/executive'],
  ['Relatórios', '/app/analytics/reports'],
  ['Predições', '/app/analytics/predictions'],
  ['IA', '/app/analytics/ai'],
] as const;

export default async function AnalyticsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Relatórios</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            KPIs, warehouse, predições e report builder
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="athena-chip-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <ExecutiveStrip accessToken={accessToken} />
      <KpiGrid accessToken={accessToken} />
    </div>
  );
}
