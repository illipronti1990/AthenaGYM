import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { OccupancyDashboardPanel } from '@/modules/operations/components/OccupancyDashboardPanel';

const links = [
  ['Agenda', '/app/operations/agenda'],
  ['Aulas', '/app/operations/aulas'],
  ['Check-in', '/app/operations/checkin'],
  ['Acesso', '/app/operations/acesso'],
  ['Parceiros', '/app/operations/parceiros'],
  ['Ocupação', '/app/operations/ocupacao'],
] as const;

export default async function OperationsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="movvo-title text-3xl">Operações</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Agenda, check-in, acesso, Wellhub/TotalPass e ocupação
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
      <OccupancyDashboardPanel accessToken={accessToken} />
    </div>
  );
}
