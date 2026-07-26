import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CampaignsPanel } from '@/modules/engagement/components/EngagementPanels';

export default async function CampaignsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/engagement" className="athena-link text-sm text-[var(--gold)]">
        ← Engajamento
      </Link>
      <h1 className="athena-title text-3xl">Campanhas</h1>
      <CampaignsPanel accessToken={accessToken} />
    </div>
  );
}
