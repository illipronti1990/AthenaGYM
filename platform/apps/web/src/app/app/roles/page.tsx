import { requireAccessToken } from '@/lib/auth/token';
import { RolesPanel } from '@/modules/roles/RolesPanel';

export default async function RolesPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="athena-title text-3xl">Cargos & permissões</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Controle de acesso da equipe</p>
      </div>
      <RolesPanel accessToken={accessToken} />
    </div>
  );
}
