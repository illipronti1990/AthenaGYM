import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { AlertsBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiAlertas() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Alertas inteligentes" description="Sinais operacionais e financeiros." />
      <BiNav current="/app/bi/alertas" />
      <PageContent>
        <AlertsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
