import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ChangePlanForm } from '@/modules/matriculas/components/ChangePlanForm';
import { matriculasApi } from '@/modules/matriculas/services/matriculasApi';

export default async function TrocarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();
  let currentPlanId = '';
  try {
    const e = await matriculasApi.getEnrollment(accessToken, id);
    currentPlanId = e.planId;
  } catch {
    currentPlanId = '';
  }

  return (
    <Page>
      <PageHeader
        title="Trocar plano"
        actions={
          <Link href={`/app/matriculas/${id}`} className="athena-btn athena-btn-secondary athena-btn-sm">
            Voltar
          </Link>
        }
      />
      <PageContent>
        <ChangePlanForm
          accessToken={accessToken}
          enrollmentId={id}
          currentPlanId={currentPlanId}
        />
      </PageContent>
    </Page>
  );
}
