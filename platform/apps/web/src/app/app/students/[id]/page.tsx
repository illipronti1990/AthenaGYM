import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { StudentProfile } from '@/modules/students/components/StudentProfile';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accessToken = await requireAccessToken();

  let unitId = '';
  try {
    const me = await apiGetMe(accessToken);
    unitId = me.auth.defaultUnitId || me.units[0]?.id || '';
  } catch {
    unitId = '';
  }

  return (
    <StudentProfile
      accessToken={accessToken}
      studentId={id}
      unitId={unitId}
    />
  );
}
