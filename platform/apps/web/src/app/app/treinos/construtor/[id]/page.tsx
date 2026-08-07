import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { WorkoutBuilder } from '@/modules/treinos/construtor/WorkoutBuilder';

export default async function TreinosConstrutorIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const accessToken = await requireAccessToken();
  const { id } = await params;
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Editar treino" description="Prescrição e assinatura." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="athena-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <WorkoutBuilder accessToken={accessToken} workoutId={id} />
      </PageContent>
    </Page>
  );
}
