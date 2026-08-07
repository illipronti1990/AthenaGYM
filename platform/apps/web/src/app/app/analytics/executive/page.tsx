import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ExecutiveStrip } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ExecutivePage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="movvo-title text-3xl">Dashboard executivo</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Visão CEO — receita, lucro, churn, conversão e check-ins
          </p>
        </div>
        <Link href="/app/analytics" className="movvo-link text-sm text-[var(--gold)]">
          ← Relatórios
        </Link>
      </div>
      <ExecutiveStrip accessToken={accessToken} />
    </div>
  );
}
