import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CheckinPanel } from '@/modules/operations/components/CheckinPanel';

export default async function CheckinPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="text-sm text-[#A3001B]">
        ← Operações
      </Link>
      <h1 className="text-2xl font-bold">Check-in</h1>
      <CheckinPanel accessToken={accessToken} />
    </div>
  );
}
