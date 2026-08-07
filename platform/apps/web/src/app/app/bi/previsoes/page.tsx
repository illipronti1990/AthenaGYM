import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { ForecastBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiPrevisoes() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Previsões" description="Modelos determinísticos com confiança." />
      <BiNav current="/app/bi/previsoes" />
      <PageContent>
        <ForecastBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
