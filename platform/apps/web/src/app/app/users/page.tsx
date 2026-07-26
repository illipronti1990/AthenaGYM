import { requireAccessToken } from '@/lib/auth/token';
import { UsersPanel } from '@/modules/users/UsersPanel';

export default async function UsersPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="athena-title text-3xl">Usuários</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Equipe e convites</p>
      </div>
      <UsersPanel accessToken={accessToken} />
    </div>
  );
}
