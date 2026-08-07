import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { EngagementDashboardPanel } from '@/modules/engagement/components/EngagementPanels';

const links = [
  ['Notificações', '/app/engagement/notifications'],
  ['Chat', '/app/engagement/chat'],
  ['Campanhas', '/app/engagement/campaigns'],
  ['Fidelidade', '/app/engagement/loyalty'],
] as const;

export default async function EngagementPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="movvo-title text-3xl">Engajamento</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Comunicação, campanhas, chat e fidelidade
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="movvo-chip-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <EngagementDashboardPanel accessToken={accessToken} />
    </div>
  );
}
