import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { PipelineBoard } from '@/modules/crm/components/pipeline/PipelineBoard';

export default async function CrmPipelinePage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Pipeline"
        description="Visualize e gerencie o funil de vendas por etapa."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/pipeline').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <PipelineBoard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
