import { requireAccessToken } from '@/lib/auth/token';
import { ChurnPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function PredictionsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prediction Engine</h1>
        <p className="text-sm text-zinc-600">Churn, conversão de leads e riscos financeiros</p>
      </div>
      <ChurnPanel accessToken={accessToken} />
    </div>
  );
}
