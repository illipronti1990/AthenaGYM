import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { ExecutiveDashboard } from '@/modules/dashboard/components/ExecutiveDashboard';

export default async function AppHomePage() {
  const accessToken = await requireAccessToken();
  let userName: string | null = null;
  try {
    const me = await apiGetMe(accessToken);
    userName = me.profile.fullName || me.profile.email;
  } catch {
    userName = null;
  }

  return <ExecutiveDashboard accessToken={accessToken} userName={userName} />;
}
