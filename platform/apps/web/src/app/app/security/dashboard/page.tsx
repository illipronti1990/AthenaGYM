import dynamic from 'next/dynamic';
import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

const SecurityDashboardPanel = dynamic(
  () =>
    import('@/modules/security/SecurityPanels').then((m) => m.SecurityDashboardPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando…</p> },
);

export default async function SecurityDashboardPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Segurança', href: '/app/security/dashboard' },
          { label: 'Dashboard' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Dashboard de segurança</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">KPIs de login, MFA, sessões e auditoria</p>
      </div>
      <SecurityDashboardPanel accessToken={accessToken} />
    </div>
  );
}
