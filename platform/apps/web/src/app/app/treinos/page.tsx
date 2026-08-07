import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { WorkoutsDashboardPanel } from '@/modules/workouts/components/WorkoutsDashboardPanel';

export default async function TreinosHubPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Treinos"
        description="Biblioteca, construtor, avaliações físicas, evolução e painel do professor."
      />
      <PageFilters>
        {TREINOS_LINKS.filter(([, href]) => href !== '/app/treinos').map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <WorkoutsDashboardPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
