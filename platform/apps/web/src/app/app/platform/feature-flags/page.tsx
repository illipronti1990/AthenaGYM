import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { FeatureFlagsPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Feature flags' }]} />
      <div>
        <h1 className="athena-title text-3xl">Feature flags</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Overrides por tenant</p>
      </div>
      <FeatureFlagsPanel accessToken={accessToken} />
    </div>
  );
}
