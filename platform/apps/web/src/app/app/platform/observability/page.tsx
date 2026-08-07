import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ObservabilityPanel } from '@/modules/platform/ObservabilityPanel';

export default async function PlatformObservabilityPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Platform', href: '/app/platform/dashboard' },
          { label: 'Observability' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Observabilidade</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Health, Redis/cache, filas, métricas e status DevOps (G-17)
        </p>
      </div>
      <ObservabilityPanel accessToken={accessToken} />
    </div>
  );
}
