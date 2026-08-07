import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TenantBrandingPanel } from '@/modules/saas/SaasPanels';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const accessToken = await requireAccessToken();
  const { id } = await params;
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Tenants', href: '/app/platform/tenants' }, { label: 'Branding' }]} />
      <div>
        <h1 className="movvo-title text-3xl">White label</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Branding e domínio próprio</p>
      </div>
      <TenantBrandingPanel accessToken={accessToken} tenantId={id} />
    </div>
  );
}
