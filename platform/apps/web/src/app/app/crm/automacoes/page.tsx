import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { AutomationStub } from '@/modules/crm/components/automation/AutomationStub';

export default async function CrmAutomacoesPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Automações"
        description="Fluxos automáticos de comunicação por gatilho de comportamento."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/automacoes').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <AutomationStub accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
