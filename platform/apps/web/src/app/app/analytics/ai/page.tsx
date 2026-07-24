import { requireAccessToken } from '@/lib/auth/token';
import { AiInsightsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function AnalyticsAiPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IA Analytics</h1>
        <p className="text-sm text-zinc-600">Perguntas em linguagem natural sobre KPIs e risco</p>
      </div>
      <AiInsightsPanel accessToken={accessToken} />
    </div>
  );
}
