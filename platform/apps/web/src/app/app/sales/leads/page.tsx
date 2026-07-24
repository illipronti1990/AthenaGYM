import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { LeadsPanel } from '@/modules/sales/components/LeadsPanel';

export default async function SalesLeadsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Link href="/app/sales" className="text-sm text-[#A3001B] hover:underline">
          ← Comercial
        </Link>
      </div>
      <LeadsPanel accessToken={accessToken} />
    </div>
  );
}
