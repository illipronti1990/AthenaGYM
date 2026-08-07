import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe, apiListUsers } from '@/services/api';
import { AlunosListPanel } from '@/modules/alunos/components/AlunosListPanel';
import { salesApi } from '@/modules/sales/services/salesApi';

function isTrainerUser(u: { roles: string[] }) {
  return u.roles.some((r) => {
    const n = r.toLowerCase();
    return (
      n.includes('professor') ||
      n.includes('trainer') ||
      n.includes('treinador') ||
      n.includes('personal')
    );
  });
}

export default async function StudentsPage() {
  const accessToken = await requireAccessToken();

  let units: Array<{ id: string; name: string }> = [];
  let planOptions: string[] = [];
  let trainerOptions: string[] = [];

  try {
    const me = await apiGetMe(accessToken);
    units = me.units.map((u) => ({ id: u.id, name: u.name }));
    const [plans, users] = await Promise.all([
      salesApi.plans(accessToken).catch(() => []),
      apiListUsers(accessToken).catch(() => []),
    ]);
    planOptions = plans.map((p) => p.name).filter(Boolean);
    trainerOptions = users
      .filter(isTrainerUser)
      .map((u) => u.fullName || u.email || '')
      .filter(Boolean);
  } catch {
    units = [];
  }

  return (
    <Page>
      <PageHeader
        title="Alunos"
        description="CRM da academia — visão completa de cada aluno em um só lugar."
        actions={
          <Link href="/app/alunos/novo" className="movvo-btn movvo-btn-primary">
            Novo aluno
          </Link>
        }
      />
      <PageContent>
        <AlunosListPanel
          accessToken={accessToken}
          units={units}
          planOptions={planOptions}
          trainerOptions={trainerOptions}
        />
      </PageContent>
    </Page>
  );
}
