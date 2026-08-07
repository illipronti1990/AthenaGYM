import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SecurityLgpdPanel } from '@/modules/security/SecurityPanels';

export default async function SecurityLgpdPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Segurança', href: '/app/security/dashboard' },
          { label: 'LGPD' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">LGPD</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Exportar, anonimizar e excluir dados do titular</p>
      </div>
      <SecurityLgpdPanel accessToken={accessToken} />
    </div>
  );
}
