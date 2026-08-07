import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PlansPanel } from '@/modules/sales/components/PlansPanel';

export default async function SalesPlansPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="movvo-title text-3xl">Planos</h1>
        <Link href="/app/sales" className="movvo-link text-sm text-[var(--gold)]">
          ← Comercial
        </Link>
      </div>
      <PlansPanel accessToken={accessToken} />
    </div>
  );
}
