import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MarketplaceSaasPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Marketplace' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Marketplace</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Plugins oficiais e parceiros</p>
      </div>
      <MarketplaceSaasPanel accessToken={accessToken} />
    </div>
  );
}
