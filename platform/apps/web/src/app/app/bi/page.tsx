import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BI_LINKS } from '@/modules/bi/utils/biLinks';
import { ExecutiveBiPanel, InsightsBiPanel } from '@/modules/bi/components/BiPanels';

export default async function BiHubPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Business Intelligence"
        description="Dashboards, KPIs, previsões, insights e Movvo AI para decisão."
      />
      <PageFilters>
        {BI_LINKS.filter(([, href]) => href !== '/app/bi').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent className="space-y-8">
        <ExecutiveBiPanel accessToken={accessToken} />
        <InsightsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
