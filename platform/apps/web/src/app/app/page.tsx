import { redirect } from 'next/navigation';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { ExecutiveDashboard } from '@/modules/dashboard/components/ExecutiveDashboard';
import { isStudentOnly } from '@/config/navAccess';

export default async function AppHomePage() {
  const accessToken = await requireAccessToken();
  let userName: string | null = null;
  let unitName: string | null = null;
  try {
    const me = await apiGetMe(accessToken);
    const roles = me.auth?.roles || me.roles?.map((r) => r.slug) || [];
    if (isStudentOnly(roles)) {
      redirect('/app/portal');
    }
    userName = me.profile.fullName || me.profile.email;
    const unitId = me.auth.defaultUnitId || me.profile.defaultUnitId || me.units[0]?.id;
    unitName = me.units.find((u) => u.id === unitId)?.name || me.units[0]?.name || null;
  } catch {
    userName = null;
  }

  return (
    <ExecutiveDashboard accessToken={accessToken} userName={userName} unitName={unitName} />
  );
}
