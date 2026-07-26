import Link from 'next/link';
import { Page, PageHeader, PageContent, Button } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { EnrollmentWizard } from '@/modules/students/components/EnrollmentWizard';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export default async function EnrollStudentPage() {
  const accessToken = await requireAccessToken();
  const me = await apiGetMe(accessToken);
  const unitId =
    [me.auth.defaultUnitId, me.profile.defaultUnitId, ...me.auth.unitIds, me.units[0]?.id].find(
      isUuid,
    ) || '';

  return (
    <Page>
      <PageHeader
        title="Nova matrícula"
        description="Wizard rápido para recepção: aluno → plano → pagamento."
        actions={
          <Link href="/app/students/new">
            <Button type="button" variant="secondary" size="sm">
              Cadastro completo
            </Button>
          </Link>
        }
      />
      <PageContent>
        <EnrollmentWizard accessToken={accessToken} unitId={unitId} />
      </PageContent>
    </Page>
  );
}
