import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { KpiBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiKpis() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Central de KPIs" description="Catálogo de indicadores por categoria." />
      <BiNav current="/app/bi/kpis" />
      <PageContent>
        <KpiBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
