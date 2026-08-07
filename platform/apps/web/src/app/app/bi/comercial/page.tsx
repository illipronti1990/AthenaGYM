import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { CommercialBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiComercial() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="IA comercial" description="ROI e ranking de campanhas." />
      <BiNav current="/app/bi/comercial" />
      <PageContent>
        <CommercialBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
