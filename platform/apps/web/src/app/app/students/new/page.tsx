import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { StudentForm } from '@/modules/students/components/StudentForm';

export default async function NewStudentPage() {
  const accessToken = await requireAccessToken();

  const me = await apiGetMe(accessToken);
  const unitId = me.auth.defaultUnitId || me.units[0]?.id;
  if (!unitId) {
    return (
      <p className="text-sm text-red-700">
        Nenhuma unidade vinculada. Configure membership/unit antes de cadastrar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Novo aluno</h1>
      <StudentForm accessToken={accessToken} unitId={unitId} />
    </div>
  );
}
