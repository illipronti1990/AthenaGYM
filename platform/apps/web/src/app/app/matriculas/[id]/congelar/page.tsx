import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { FreezeForm } from '@/modules/matriculas/components/FreezeForm';

export default async function CongelarMatriculaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Congelar matrícula"
        actions={
          <Link href={`/app/matriculas/${id}`} className="athena-btn athena-btn-secondary athena-btn-sm">
            Voltar
          </Link>
        }
      />
      <PageContent>
        <FreezeForm accessToken={accessToken} enrollmentId={id} />
      </PageContent>
    </Page>
  );
}
