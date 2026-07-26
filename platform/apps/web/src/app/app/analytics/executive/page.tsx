import { requireAccessToken } from '@/lib/auth/token';
import { ExecutiveStrip } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ExecutivePage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="athena-title text-3xl">Dashboard executivo</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Visão CEO — receita, lucro, churn, conversão e check-ins</p>
      </div>
      <ExecutiveStrip accessToken={accessToken} />
    </div>
  );
}
