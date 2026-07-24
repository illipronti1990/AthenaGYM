import { requireAccessToken } from '@/lib/auth/token';
import { RolesPanel } from '@/modules/roles/RolesPanel';

export default async function RolesPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cargos & permissões</h1>
      <RolesPanel accessToken={accessToken} />
    </div>
  );
}
