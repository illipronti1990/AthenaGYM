import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { OccupancyDashboardPanel } from '@/modules/operations/components/OccupancyDashboardPanel';

export default async function OcupacaoPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="text-sm text-[#A3001B]">
        ← Operações
      </Link>
      <h1 className="text-2xl font-bold">Ocupação</h1>
      <OccupancyDashboardPanel accessToken={accessToken} />
    </div>
  );
}
