import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { AssessmentForm } from '@/modules/treinos/avaliacoes/AssessmentForm';

export default async function TreinosAvaliacoesPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Avaliação física" description="Antropometria, FC/PA, skinfolds e fotos." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <AssessmentForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
