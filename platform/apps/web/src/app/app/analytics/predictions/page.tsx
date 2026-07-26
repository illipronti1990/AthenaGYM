import { requireAccessToken } from '@/lib/auth/token';
import { ChurnPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function PredictionsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="athena-title text-3xl">Prediction Engine</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Churn, conversão de leads e riscos financeiros</p>
      </div>
      <ChurnPanel accessToken={accessToken} />
    </div>
  );
}
