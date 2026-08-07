import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { InsightsBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiInsights() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Movvo Insights" description="Recomendações acionáveis por regras." />
      <BiNav current="/app/bi/insights" />
      <PageContent>
        <InsightsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
