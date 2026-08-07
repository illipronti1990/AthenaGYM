import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { ChurnRiskCard } from '@/modules/crm/components/risk/ChurnRiskCard';
import { NextBestActionList } from '@/modules/crm/components/risk/NextBestActionList';

export default async function CrmRiscoPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Risco de Churn"
        description="Alunos com maior probabilidade de cancelamento e ações sugeridas."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/risco').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          <ChurnRiskCard accessToken={accessToken} />
          <NextBestActionList accessToken={accessToken} />
        </div>
      </PageContent>
    </Page>
  );
}
