import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SecuritySessionsPanel, SecurityMfaPanel } from '@/modules/security/SecurityPanels';

export default async function SecuritySessionsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Segurança', href: '/app/security/dashboard' },
          { label: 'Sessões' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Sessões e MFA</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Gerencie dispositivos ativos e autenticação em dois fatores</p>
      </div>
      <SecuritySessionsPanel accessToken={accessToken} />
      <SecurityMfaPanel accessToken={accessToken} />
    </div>
  );
}
