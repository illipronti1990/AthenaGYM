import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ACESSO_LINKS } from '@/modules/acesso/utils/acessoLinks';
import { PresenceBoard } from '@/modules/acesso/components/PresenceBoard';

export default async function AcessoHubPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Acesso"
        description="Check-in inteligente, presença, monitor ao vivo e regras da unidade."
      />
      <PageFilters>
        {ACESSO_LINKS.filter(([, href]) => href !== '/app/acesso').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <PresenceBoard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
