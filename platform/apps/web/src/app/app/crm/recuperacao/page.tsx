import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CRM_LINKS } from '@/modules/crm/utils/crmLinks';
import { RecoveryList } from '@/modules/crm/components/recovery/RecoveryList';

export default async function CrmRecuperacaoPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Recuperação"
        description="Alunos inativos que precisam de reengajamento."
      />
      <PageFilters>
        {CRM_LINKS.filter(([, href]) => href !== '/app/crm/recuperacao').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <RecoveryList accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
