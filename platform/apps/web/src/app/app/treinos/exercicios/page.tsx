import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TREINOS_LINKS } from '@/modules/treinos/utils/treinosLinks';
import { ExerciseLibrary } from '@/modules/treinos/exercicios/ExerciseLibrary';

export default async function TreinosExerciciosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Biblioteca de exercícios" description="Filtros, CRUD e mídia." />
      <PageFilters>
        {TREINOS_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent>
        <ExerciseLibrary accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
