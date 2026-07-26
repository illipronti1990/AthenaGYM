import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { OccupancyDashboardPanel } from '@/modules/operations/components/OccupancyDashboardPanel';

export default async function OcupacaoPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="athena-link text-sm text-[var(--gold)]">
        ← Operações
      </Link>
      <h1 className="athena-title text-3xl">Ocupação</h1>
      <OccupancyDashboardPanel accessToken={accessToken} />
    </div>
  );
}
