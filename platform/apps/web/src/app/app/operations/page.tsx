import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { OccupancyDashboardPanel } from '@/modules/operations/components/OccupancyDashboardPanel';

const links = [
  ['Agenda', '/app/operations/agenda'],
  ['Aulas', '/app/operations/aulas'],
  ['Check-in', '/app/operations/checkin'],
  ['Acesso', '/app/operations/acesso'],
  ['Ocupação', '/app/operations/ocupacao'],
] as const;

export default async function OperationsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Operações</h1>
          <p className="text-sm text-zinc-600">Agenda, check-in, acesso e ocupação em tempo real</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:border-[#A3001B] hover:text-[#A3001B]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <OccupancyDashboardPanel accessToken={accessToken} />
    </div>
  );
}
