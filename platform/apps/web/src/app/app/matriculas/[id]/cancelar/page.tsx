import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CancelForm } from '@/modules/matriculas/components/CancelForm';

export default async function CancelarMatriculaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Cancelar matrícula"
        actions={
          <Link href={`/app/matriculas/${id}`} className="movvo-btn movvo-btn-secondary movvo-btn-sm">
            Voltar
          </Link>
        }
      />
      <PageContent>
        <CancelForm accessToken={accessToken} enrollmentId={id} />
      </PageContent>
    </Page>
  );
}
