import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { TemplatesPanel } from '@/modules/treinos/construtor/TemplatesPanel';

export default async function TreinosTemplatesPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Templates" description="Biblioteca de fichas e aplicação ao aluno." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <TemplatesPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
