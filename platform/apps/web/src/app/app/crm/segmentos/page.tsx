import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { SegmentBuilder } from '@/modules/crm/components/segments/SegmentBuilder';

export default async function CrmSegmentosPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Segmentos"
        description="Crie grupos de alunos por critérios para campanhas direcionadas."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/segmentos').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <SegmentBuilder accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
