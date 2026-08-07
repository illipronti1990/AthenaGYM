import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PortalTreinos } from '@/modules/portal/components/PortalPanels';

export default async function PortalTreinosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Meus treinos" description="Fichas publicadas pelo professor." />
      <PageContent>
        <PortalTreinos accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
