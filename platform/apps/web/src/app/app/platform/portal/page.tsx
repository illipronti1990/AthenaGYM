import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PortalPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Portal do cliente' }]} />
      <div>
        <h1 className="athena-title text-3xl">Portal do cliente</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Plano, consumo e chamados</p>
      </div>
      <PortalPanel accessToken={accessToken} />
    </div>
  );
}
