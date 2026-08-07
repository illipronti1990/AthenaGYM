import dynamic from 'next/dynamic';
import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const SaasDashboardPanel = dynamic(
  () => import('@/modules/saas/SaasPanels').then((m) => m.SaasDashboardPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando…</p> },
);

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Platform', href: '/app/platform/dashboard' }, { label: 'Dashboard SaaS' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Dashboard SaaS</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">KPIs da plataforma</p>
      </div>
      <SaasDashboardPanel accessToken={accessToken} />
    </div>
  );
}
