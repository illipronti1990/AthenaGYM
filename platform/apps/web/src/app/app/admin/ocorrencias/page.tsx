import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { IncidentsPanel } from '@/modules/admin/AdminPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Ocorrências' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Ocorrências</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Incidentes internos</p>
      </div>
      <IncidentsPanel accessToken={accessToken} />
    </div>
  );
}
