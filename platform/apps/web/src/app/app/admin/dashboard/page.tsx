import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AdminDashboardPanel } from '@/modules/admin/AdminPanels';

export default async function AdminDashboardPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin' }, { label: 'Dashboard' }]} />
      <div>
        <h1 className="athena-title text-3xl">Dashboard administrativo</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">KPIs de RH, patrimônio e operações</p>
      </div>
      <AdminDashboardPanel accessToken={accessToken} />
    </div>
  );
}
