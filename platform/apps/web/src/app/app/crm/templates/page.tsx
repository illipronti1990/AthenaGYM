import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { TemplateEditor } from '@/modules/crm/components/templates/TemplateEditor';

export default async function CrmTemplatesPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Templates"
        description="Crie e gerencie modelos de mensagem para campanhas e automações."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/templates').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <TemplateEditor accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
