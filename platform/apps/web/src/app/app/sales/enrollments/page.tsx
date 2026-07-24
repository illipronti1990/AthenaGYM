import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { EnrollmentsPanel } from '@/modules/sales/components/ContractsPanel';

export default async function SalesEnrollmentsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Matrículas</h1>
        <Link href="/app/sales" className="text-sm text-[#A3001B] hover:underline">
          ← Comercial
        </Link>
      </div>
      <EnrollmentsPanel accessToken={accessToken} />
    </div>
  );
}
