import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ReportsPanel } from '@/modules/analytics/components/AnalyticsPanels';

export default async function ReportsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Relatórios</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Builder, exportação Excel/PDF/CSV e agendamento
          </p>
        </div>
        <Link href="/app/analytics" className="athena-link text-sm text-[var(--gold)]">
          ← Relatórios
        </Link>
      </div>
      <ReportsPanel accessToken={accessToken} />
    </div>
  );
}
