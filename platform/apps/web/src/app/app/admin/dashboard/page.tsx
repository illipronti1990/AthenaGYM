import dynamic from 'next/dynamic';
import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const AdminDashboardPanel = dynamic(
  () => import('@/modules/admin/AdminPanels').then((m) => m.AdminDashboardPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando…</p> },
);

export default async function AdminDashboardPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin' }, { label: 'Dashboard' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Dashboard administrativo</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">KPIs de RH, patrimônio e operações</p>
      </div>
      <AdminDashboardPanel accessToken={accessToken} />
    </div>
  );
}
