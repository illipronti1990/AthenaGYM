import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PartnerDashboardCard } from '@/modules/acesso/components/PartnerDashboardCard';
import { PartnerLogsPanel } from '@/modules/acesso/components/PartnerLogsPanel';

export default async function TotalPassPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="TotalPass" description="Widget, sync stub e logs da integração." />
      <p className="mb-4">
        <Link href="/app/integracoes" className="movvo-link text-sm text-[var(--gold)]">
          ← Integrações
        </Link>
      </p>
      <PageContent className="space-y-6">
        <PartnerDashboardCard accessToken={accessToken} provider="totalpass" />
        <PartnerLogsPanel accessToken={accessToken} provider="totalpass" />
      </PageContent>
    </Page>
  );
}
