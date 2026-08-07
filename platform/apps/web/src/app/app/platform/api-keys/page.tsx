import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ApiKeysPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'API Keys' }]} />
      <div>
        <h1 className="movvo-title text-3xl">API Keys</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Chaves públicas/privadas</p>
      </div>
      <ApiKeysPanel accessToken={accessToken} />
    </div>
  );
}
