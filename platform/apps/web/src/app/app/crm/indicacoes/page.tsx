import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { ReferralBoard } from '@/modules/crm/components/referrals/ReferralBoard';

export default async function CrmIndicacoesPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Indicações"
        description="Acompanhe o programa de indicações e recompensas por alunos trazidos."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/indicacoes').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <ReferralBoard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
