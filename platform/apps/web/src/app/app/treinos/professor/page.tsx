import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { CoachDashboardPanel } from '@/modules/treinos/coach/CoachDashboard';

export default async function TreinosProfessorPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Painel do professor" description="KPIs, avaliações pendentes e agenda do dia." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <CoachDashboardPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
