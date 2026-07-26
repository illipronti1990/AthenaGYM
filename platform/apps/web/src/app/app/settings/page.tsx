import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { SettingsHub } from '@/modules/settings/components/SettingsHub';

export default async function SettingsPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Configurações"
        description="Academia, financeiro, backup, logs e acessos."
      />
      <PageContent>
        <SettingsHub accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
