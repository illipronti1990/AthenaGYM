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
          <h1 className="text-2xl font-bold">Business Intelligence</h1>
          <p className="text-sm text-zinc-600">KPIs, warehouse, predições e report builder</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded border border-zinc-300 px-3 py-1.5 hover:border-[#A3001B] hover:text-[#A3001B]"
            >
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
