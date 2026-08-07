import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CommercialAnalyticsPanel } from '@/modules/commercial/CommercialAnalyticsPanel';

export default async function CommercialAnalyticsPage() {
  const token = await requireAccessToken();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="movvo-title text-3xl">Analytics comercial</h1>
        <Link href="/app/commercial" className="movvo-link text-sm text-[var(--gold)]">← CRM</Link>
      </div>
      <CommercialAnalyticsPanel accessToken={token} />
    </div>
  );
}
