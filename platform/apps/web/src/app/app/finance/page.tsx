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
          <h1 className="athena-title text-3xl">Financeiro</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">KPIs do mês corrente</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="athena-chip-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <FinanceDashboardPanel accessToken={accessToken} />
    </div>
  );
}
