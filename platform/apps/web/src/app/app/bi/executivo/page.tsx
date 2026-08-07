import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { ExecutiveBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiExecutivo() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Dashboard executivo" description="KPIs em tempo real da academia." />
      <BiNav current="/app/bi/executivo" />
      <PageContent>
        <ExecutiveBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
