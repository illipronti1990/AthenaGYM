import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe, apiHealth } from '@/services/api';

export default async function AppHomePage() {
  const accessToken = await requireAccessToken();

  let meError: string | null = null;
  let me = null;
  try {
    me = await apiGetMe(accessToken);
  } catch (e) {
    meError = e instanceof Error ? e.message : 'erro';
  }

  let health = null;
  try {
    health = await apiHealth();
  } catch {
    health = { status: 'down' };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-zinc-600">
        API health: <strong>{health?.status}</strong>
      </p>
      {meError ? (
        <p className="text-sm text-red-700">{meError}</p>
      ) : (
        <pre className="overflow-auto rounded bg-zinc-900 p-4 text-xs text-zinc-100">
          {JSON.stringify(
            {
              profile: me?.profile,
              roles: me?.auth.roles,
              permissions: me?.permissions,
              companyId: me?.auth.companyId,
              unitIds: me?.auth.unitIds,
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}
