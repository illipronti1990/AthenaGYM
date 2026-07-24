import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CampaignsPanel } from '@/modules/engagement/components/EngagementPanels';

export default async function CampaignsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/engagement" className="text-sm text-[#A3001B]">
        ← Engajamento
      </Link>
      <h1 className="text-2xl font-bold">Campanhas</h1>
      <CampaignsPanel accessToken={accessToken} />
    </div>
  );
}
