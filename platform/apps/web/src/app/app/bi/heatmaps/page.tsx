import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { HeatmapBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiHeatmaps() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Heatmaps" description="Horários, dias e modalidades mais movimentados." />
      <BiNav current="/app/bi/heatmaps" />
      <PageContent>
        <HeatmapBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
