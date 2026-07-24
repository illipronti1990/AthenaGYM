import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { FinanceDashboardPanel } from '@/modules/finance/components/FinanceDashboardPanel';

const links = [
  ['A receber', '/app/finance/receivables'],
  ['A pagar', '/app/finance/payables'],
  ['Assinaturas', '/app/finance/subscriptions'],
  ['Fluxo de caixa', '/app/finance/cashflow'],
  ['DRE', '/app/finance/reports'],
  ['Conciliação', '/app/finance/reconciliation'],
  ['Configurações', '/app/finance/settings'],
] as const;

export default async function FinancePage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-zinc-600">KPIs do mês corrente</p>
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
      <FinanceDashboardPanel accessToken={accessToken} />
    </div>
  );
}
