import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SecurityAuditPanel } from '@/modules/security/SecurityPanels';

export default async function SecurityAuditPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Segurança', href: '/app/security/dashboard' },
          { label: 'Auditoria' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Auditoria</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Trilha de auditoria global</p>
      </div>
      <SecurityAuditPanel accessToken={accessToken} />
    </div>
  );
}
