import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { HealthPanel } from '@/modules/polish/components/HealthPanel';

export default async function AdminHealthPage() {
  await requireAccessToken();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Admin' },
          { label: 'Saúde do sistema' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Saúde do sistema</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Status de API, banco e serviços</p>
      </div>
      <HealthPanel />
    </div>
  );
}
