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
      <h1 className="text-2xl font-bold">Alunos</h1>
      <StudentsListPanel accessToken={accessToken} units={units} />
    </div>
  );
}
