import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { NpsSurvey } from '@/modules/crm/components/nps/NpsSurvey';

export default async function CrmNpsPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="NPS"
        description="Net Promoter Score — satisfação e lealdade dos alunos."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/nps').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <NpsSurvey accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
