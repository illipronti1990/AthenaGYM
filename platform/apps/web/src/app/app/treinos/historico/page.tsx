import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { TrainingTimeline } from '@/modules/treinos/coach/TrainingTimeline';

export default async function TreinosHistoricoPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Histórico de treinos" description="Timeline de treinos, avaliações e alterações." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <TrainingTimeline accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
