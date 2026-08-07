import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { INTEGRACOES_LINKS } from '@/modules/acesso/utils/acessoLinks';
import { PartnerDashboardCard } from '@/modules/acesso/components/PartnerDashboardCard';
import { PartnersPanel } from '@/modules/operations/components/PartnersPanel';

export default async function IntegracoesHubPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Integrações"
        description="Hub de parceiros: Wellhub, TotalPass e catracas (stubs)."
      />
      <PageFilters>
        {INTEGRACOES_LINKS.filter(([, href]) => href !== '/app/integracoes').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <PartnerDashboardCard accessToken={accessToken} provider="wellhub" />
          <PartnerDashboardCard accessToken={accessToken} provider="totalpass" />
        </div>
        <PartnersPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
