import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { LeadForm } from '@/modules/crm/components/leads/LeadForm';

export default async function CrmLeadsPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Leads"
        description="Cadastre e gerencie leads. Converta para aluno com um clique."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/leads').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <LeadForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
