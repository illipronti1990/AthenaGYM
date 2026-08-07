import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { NotificationsPanel } from '@/modules/engagement/components/EngagementPanels';

export default async function NotificationsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/engagement" className="movvo-link text-sm text-[var(--gold)]">
        ← Engajamento
      </Link>
      <h1 className="movvo-title text-3xl">Notificações</h1>
      <NotificationsPanel accessToken={accessToken} />
    </div>
  );
}
