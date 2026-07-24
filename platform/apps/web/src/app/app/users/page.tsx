import { requireAccessToken } from '@/lib/auth/token';
import { UsersPanel } from '@/modules/users/UsersPanel';

export default async function UsersPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <UsersPanel accessToken={accessToken} />
    </div>
  );
}
