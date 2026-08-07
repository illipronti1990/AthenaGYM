import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { RenewForm } from '@/modules/matriculas/components/RenewForm';

export default async function RenovarMatriculaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Renovar matrícula"
        actions={
          <Link href={`/app/matriculas/${id}`} className="athena-btn athena-btn-secondary athena-btn-sm">
            Voltar
          </Link>
        }
      />
      <PageContent>
        <RenewForm accessToken={accessToken} enrollmentId={id} />
      </PageContent>
    </Page>
  );
}
