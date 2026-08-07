import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { BillingPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Billing' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Assinaturas e faturas</p>
      </div>
      <BillingPanel accessToken={accessToken} />
    </div>
  );
}
