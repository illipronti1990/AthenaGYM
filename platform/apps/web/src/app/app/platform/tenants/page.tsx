import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TenantsPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Tenants' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Tenants</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Gestão de empresas clientes</p>
      </div>
      <TenantsPanel accessToken={accessToken} />
    </div>
  );
}
