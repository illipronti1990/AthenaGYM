import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { FinanceDashboardPanel } from '@/modules/finance/components/FinanceDashboardPanel';
import { FinancePrefetch } from '@/modules/finance/components/FinancePrefetch';
import { FINANCEIRO_LINKS } from '@/modules/finance/utils/financeLinks';

export default async function FinanceiroPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <FinancePrefetch />
      <PageHeader
        title="Financeiro"
        description="KPIs do mês corrente, saúde financeira e atalhos operacionais."
      />
      <PageFilters>
        {FINANCEIRO_LINKS.filter(([, href]) => href !== '/app/financeiro').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
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
