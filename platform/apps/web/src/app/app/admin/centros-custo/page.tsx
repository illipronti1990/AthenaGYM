import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CostCentersPanel } from '@/modules/admin/AdminPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Centros de custo' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Centros de custo</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Categorias administrativas (reutiliza financeiro)</p>
      </div>
      <CostCentersPanel accessToken={accessToken} />
    </div>
  );
}
