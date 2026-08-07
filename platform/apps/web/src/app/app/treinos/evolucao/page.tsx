import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { EvolutionCharts } from '@/modules/treinos/evolucao/EvolutionCharts';

export default async function TreinosEvolucaoPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Evolução" description="Séries de peso, IMC, massa e gordura." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <EvolutionCharts accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
