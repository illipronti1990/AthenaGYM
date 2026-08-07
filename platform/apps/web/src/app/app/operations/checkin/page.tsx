import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CheckinPanel } from '@/modules/operations/components/CheckinPanel';

export default async function CheckinPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="movvo-link text-sm text-[var(--gold)]">
        ← Operações
      </Link>
      <h1 className="movvo-title text-3xl">Check-in</h1>
      <CheckinPanel accessToken={accessToken} />
    </div>
  );
}
