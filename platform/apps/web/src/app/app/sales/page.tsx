import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { SalesDashboardPanel } from '@/modules/sales/components/SalesDashboardPanel';

export default async function SalesDashboardPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="movvo-title text-3xl">Comercial</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">KPIs do funil (últimos 30 dias)</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {[
            ['Leads', '/app/sales/leads'],
            ['Pipeline', '/app/sales/pipeline'],
            ['Planos', '/app/matriculas/planos'],
            ['Matrículas', '/app/matriculas'],
            ['Contratos', '/app/matriculas/contratos'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="movvo-chip-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <SalesDashboardPanel accessToken={accessToken} />
    </div>
  );
}
