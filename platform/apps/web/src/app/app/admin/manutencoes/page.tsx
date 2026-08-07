import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MaintenancePanel } from '@/modules/admin/AdminPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Manutenções' }]} />
      <div>
        <h1 className="athena-title text-3xl">Manutenções</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">OS preventiva/corretiva com fotos</p>
      </div>
      <MaintenancePanel accessToken={accessToken} />
    </div>
  );
}
