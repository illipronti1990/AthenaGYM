import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PortalHome } from '@/modules/portal/components/PortalPanels';

export default async function StudentPortalPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Portal do aluno"
        description="Seus treinos, evolução e dados da matrícula."
      />
      <PageContent>
        <PortalHome accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
