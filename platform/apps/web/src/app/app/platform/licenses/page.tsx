import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LicensesPanel } from '@/modules/saas/SaasPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Licenças' }]} />
      <div>
        <h1 className="athena-title text-3xl">Licenças</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Uso vs limites</p>
      </div>
      <LicensesPanel accessToken={accessToken} />
    </div>
  );
}
