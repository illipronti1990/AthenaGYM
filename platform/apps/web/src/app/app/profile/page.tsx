import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { ProfileForm } from '@/modules/profile/ProfileForm';

export default async function ProfilePage() {
  const accessToken = await requireAccessToken();

  const me = await apiGetMe(accessToken);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="movvo-title text-3xl">Meu perfil</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Dados pessoais e preferências</p>
      </div>
      <ProfileForm profile={me.profile} accessToken={accessToken} />
    </div>
  );
}
