import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { SalesDashboardPanel } from '@/modules/sales/components/SalesDashboardPanel';

export default async function SalesDashboardPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comercial</h1>
          <p className="text-sm text-zinc-600">KPIs do funil (últimos 30 dias)</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {[
            ['Leads', '/app/sales/leads'],
            ['Pipeline', '/app/sales/pipeline'],
            ['Planos', '/app/sales/plans'],
            ['Matrículas', '/app/sales/enrollments'],
            ['Contratos', '/app/sales/contracts'],
          ].map(([label, href]) => (
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
      <SalesDashboardPanel accessToken={accessToken} />
    </div>
  );
}
