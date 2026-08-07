import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { WebhooksPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Webhooks' }]} />
      <div>
        <h1 className="athena-title text-3xl">Webhooks</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Assinaturas e reenvio</p>
      </div>
      <WebhooksPanel accessToken={accessToken} />
    </div>
  );
}
