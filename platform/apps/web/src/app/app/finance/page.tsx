import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { FinanceDashboardPanel } from '@/modules/finance/components/FinanceDashboardPanel';
import { FinancePrefetch } from '@/modules/finance/components/FinancePrefetch';

const links = [
  ['Caixa', '/app/finance/cashflow'],
  ['Receitas', '/app/finance/receivables'],
  ['Despesas', '/app/finance/payables'],
  ['Mensalidades', '/app/finance/subscriptions'],
  ['DRE', '/app/finance/reports'],
  ['Conciliação', '/app/finance/reconciliation'],
  ['Configurações', '/app/finance/settings'],
] as const;

export default async function FinancePage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <FinancePrefetch />
      <PageHeader
        title="Financeiro"
        description="KPIs do mês corrente e atalhos operacionais."
      />
      <PageFilters>
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <FinanceDashboardPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
