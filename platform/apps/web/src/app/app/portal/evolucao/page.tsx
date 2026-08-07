import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PortalEvolucao } from '@/modules/portal/components/PortalPanels';

export default async function PortalEvolucaoPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Minha evolução" description="Avaliações, medidas e progresso." />
      <PageContent>
        <PortalEvolucao accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
