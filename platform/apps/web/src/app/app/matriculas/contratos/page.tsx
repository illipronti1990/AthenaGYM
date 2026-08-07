import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ContractsListPanel } from '@/modules/matriculas/components/ContractsListPanel';

export default async function MatriculasContratosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Contratos"
        description="Contratos digitais gerados nas matrículas."
        actions={
          <Link href="/app/matriculas" className="movvo-btn movvo-btn-secondary movvo-btn-sm">
            Matrículas
          </Link>
        }
      />
      <PageContent>
        <ContractsListPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
