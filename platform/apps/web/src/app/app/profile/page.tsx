import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { ProfileForm } from '@/modules/profile/ProfileForm';

export default async function ProfilePage() {
  const accessToken = await requireAccessToken();

  const me = await apiGetMe(accessToken);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <ProfileForm profile={me.profile} accessToken={accessToken} />
    </div>
  );
}
