import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmployeesPanel } from '@/modules/admin/AdminPanels';

export default async function AdminEmployeesPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Colaboradores' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Colaboradores</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Cadastro RH (independente do login)</p>
      </div>
      <EmployeesPanel accessToken={accessToken} />
    </div>
  );
}
