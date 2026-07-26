import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AiInsightsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function AnalyticsAiPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">IA Analytics</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Perguntas em linguagem natural sobre KPIs e risco
          </p>
        </div>
        <Link href="/app/analytics" className="athena-link text-sm text-[var(--gold)]">
          ← Relatórios
        </Link>
      </div>
      <AiInsightsPanel accessToken={accessToken} />
    </div>
  );
}
