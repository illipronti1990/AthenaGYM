import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { CampaignForm } from '@/modules/crm/components/campaigns/CampaignForm';

export default async function CrmCampanhasPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Campanhas"
        description="Crie e dispare campanhas de push, e-mail e SMS para alunos."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/campanhas').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <CampaignForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
