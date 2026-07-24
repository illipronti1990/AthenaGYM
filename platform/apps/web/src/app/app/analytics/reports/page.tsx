import { requireAccessToken } from '@/lib/auth/token';
import { ReportsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ReportsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-zinc-600">Builder, exportação Excel/PDF/CSV e agendamento</p>
      </div>
      <ReportsPanel accessToken={accessToken} />
    </div>
  );
}
