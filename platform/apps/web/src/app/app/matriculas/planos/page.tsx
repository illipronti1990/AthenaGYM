import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PlansPanel } from '@/modules/matriculas/components/PlansPanel';

export default async function MatriculasPlanosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page>
      <PageHeader
        title="Planos"
        description="Cadastro completo de planos comerciais da academia."
        actions={
          <Link href="/app/matriculas" className="athena-btn athena-btn-secondary athena-btn-sm">
            Matrículas
          </Link>
        }
      />
      <PageContent>
        <PlansPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
