import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { LoyaltyPanel } from '@/modules/engagement/components/EngagementPanels';

export default async function LoyaltyPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/engagement" className="text-sm text-[#A3001B]">
        ← Engajamento
      </Link>
      <h1 className="text-2xl font-bold">Fidelidade & Desafios</h1>
      <LoyaltyPanel accessToken={accessToken} />
    </div>
  );
}
