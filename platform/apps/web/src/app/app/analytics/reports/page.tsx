import { requireAccessToken } from '@/lib/auth/token';
import { ReportsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ReportsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="athena-title text-3xl">Relatórios</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Builder, exportação Excel/PDF/CSV e agendamento</p>
      </div>
      <ReportsPanel accessToken={accessToken} />
    </div>
  );
}
