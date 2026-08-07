import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AdminConfigPanel } from '@/modules/admin/AdminPanels';

export default async function AdminConfigPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Config' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Configuração administrativa</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Departamentos, cargos HR e parâmetros</p>
      </div>
      <AdminConfigPanel accessToken={accessToken} />
    </div>
  );
}
