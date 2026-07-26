import { requireAccessToken } from '@/lib/auth/token';
import { AiInsightsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function AnalyticsAiPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="athena-title text-3xl">IA Analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Perguntas em linguagem natural sobre KPIs e risco</p>
      </div>
      <AiInsightsPanel accessToken={accessToken} />
    </div>
  );
}
