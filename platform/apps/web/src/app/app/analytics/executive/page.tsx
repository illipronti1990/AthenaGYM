import { requireAccessToken } from '@/lib/auth/token';
import { ExecutiveStrip } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ExecutivePage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard executivo</h1>
        <p className="text-sm text-zinc-600">Visão CEO — receita, lucro, churn, conversão e check-ins</p>
      </div>
      <ExecutiveStrip accessToken={accessToken} />
    </div>
  );
}
