import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EnrollmentsListPanel } from '@/modules/matriculas/components/EnrollmentsListPanel';

export default async function MatriculasPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Matrículas"
        description="Gestão de matrículas, renovações e ciclo de vida dos planos."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/matriculas/planos" className="movvo-btn movvo-btn-secondary movvo-btn-sm">
              Planos
            </Link>
            <Link href="/app/matriculas/contratos" className="movvo-btn movvo-btn-secondary movvo-btn-sm">
              Contratos
            </Link>
            <Link href="/app/matriculas/nova" className="movvo-btn movvo-btn-primary">
              Nova matrícula
            </Link>
          </div>
        }
      />
      <PageContent>
        <EnrollmentsListPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
