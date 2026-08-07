import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
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
          <Link href="/app/matriculas" className="athena-btn athena-btn-secondary athena-btn-sm">
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
