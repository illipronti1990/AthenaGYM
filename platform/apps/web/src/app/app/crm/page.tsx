import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { CrmDashboard } from '@/modules/crm/components/dashboard/CrmDashboard';

export default async function CrmHubPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="CRM"
        description="Leads, pipeline, campanhas, fidelidade, NPS e recuperação de alunos."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <CrmDashboard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
