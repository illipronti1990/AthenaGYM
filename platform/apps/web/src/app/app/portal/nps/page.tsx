import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PortalNpsForm } from '@/modules/crm/components/nps/PortalNpsForm';

export default async function PortalNpsPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Avalie sua academia"
        description="Sua opinião é muito importante para nós."
      />
      <PageContent>
        <PortalNpsForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
