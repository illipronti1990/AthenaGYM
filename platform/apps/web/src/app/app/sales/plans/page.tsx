import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PlansPanel } from '@/modules/sales/components/PlansPanel';

export default async function SalesPlansPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Planos</h1>
        <Link href="/app/sales" className="text-sm text-[#A3001B] hover:underline">
          ← Comercial
        </Link>
      </div>
      <PlansPanel accessToken={accessToken} />
    </div>
  );
}
