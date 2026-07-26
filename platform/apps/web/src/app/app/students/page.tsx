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
    <div className="space-y-4">
      <div>
        <h1 className="athena-title text-3xl">Alunos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Cadastro e acompanhamento</p>
      </div>
      <StudentsListPanel accessToken={accessToken} units={units} />
    </div>
  );
}
