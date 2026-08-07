import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { LoyaltyPanel } from '@/modules/crm/components/loyalty/LoyaltyPanel';

export default async function CrmFidelidadePage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Fidelidade"
        description="Gerencie pontos, recompensas e regras de acúmulo do programa de fidelidade."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/fidelidade').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <LoyaltyPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
