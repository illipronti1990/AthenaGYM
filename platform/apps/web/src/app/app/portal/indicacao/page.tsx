import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PortalReferralForm } from '@/modules/crm/components/referrals/PortalReferralForm';

export default async function PortalIndicacaoPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Indicar amigo"
        description="Traga um amigo e ganhe recompensas no programa de fidelidade."
      />
      <PageContent>
        <PortalReferralForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
