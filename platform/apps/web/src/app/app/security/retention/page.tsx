import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SecurityRetentionPanel } from '@/modules/security/SecurityPanels';

export default async function SecurityRetentionPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Segurança', href: '/app/security/dashboard' },
          { label: 'Retenção' },
        ]}
      />
      <div>
        <h1 className="movvo-title text-3xl">Políticas de retenção</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Logs, auditoria, arquivos e eventos de segurança</p>
      </div>
      <SecurityRetentionPanel accessToken={accessToken} />
    </div>
  );
}
