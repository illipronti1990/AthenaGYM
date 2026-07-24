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
          <h1 className="text-2xl font-bold">Engajamento</h1>
          <p className="text-sm text-zinc-600">Comunicação, campanhas, chat e fidelidade</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded border border-zinc-300 px-3 py-1.5 hover:border-[#A3001B] hover:text-[#A3001B]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <EngagementDashboardPanel accessToken={accessToken} />
    </div>
  );
}
