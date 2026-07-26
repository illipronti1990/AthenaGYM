import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { StudentsListPanel } from '@/modules/students/components/StudentsListPanel';

export default async function StudentsPage() {
  const accessToken = await requireAccessToken();

  let units: Array<{ id: string; name: string }> = [];
  try {
    const me = await apiGetMe(accessToken);
    units = me.units.map((u) => ({ id: u.id, name: u.name }));
  } catch {
    units = [];
  }

  return (
    <Page>
      <PageHeader
        title="Alunos"
        description="Gerencie todos os alunos cadastrados."
        actions={
          <Link href="/app/students/new" className="athena-btn athena-btn-primary">
            Novo aluno
          </Link>
        }
      />
      <PageContent>
        <StudentsListPanel accessToken={accessToken} units={units} />
      </PageContent>
    </Page>
  );
}
