import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EnrollmentDetailPanel } from '@/modules/matriculas/components/EnrollmentDetailPanel';

export default async function MatriculaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Detalhe da matrícula"
        actions={
          <Link href="/app/matriculas" className="movvo-btn movvo-btn-secondary movvo-btn-sm">
            Voltar
          </Link>
        }
      />
      <PageContent>
        <EnrollmentDetailPanel accessToken={accessToken} enrollmentId={id} />
      </PageContent>
    </Page>
  );
}
