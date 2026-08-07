import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { GoalsBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiMetas() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Metas" description="Acompanhe progresso das metas do mês." />
      <BiNav current="/app/bi/metas" />
      <PageContent>
        <GoalsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
