import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AdminRolesPanel } from '@/modules/admin/AdminPanels';

export default async function AdminCargosPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Cargos' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Cargos & permissões</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Matriz RBAC do sistema</p>
      </div>
      <AdminRolesPanel accessToken={accessToken} />
    </div>
  );
}
