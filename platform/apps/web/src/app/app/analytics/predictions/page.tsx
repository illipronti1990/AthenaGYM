import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ChurnPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function PredictionsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Prediction Engine</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Churn, conversão de leads e riscos financeiros
          </p>
        </div>
        <Link href="/app/analytics" className="athena-link text-sm text-[var(--gold)]">
          ← Relatórios
        </Link>
      </div>
      <ChurnPanel accessToken={accessToken} />
    </div>
  );
}
