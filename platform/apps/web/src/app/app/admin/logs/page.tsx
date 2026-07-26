import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { AdminLogsPanel } from '@/modules/polish/components/AdminLogsPanel';

export default async function AdminLogsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[{ label: 'App', href: '/app' }, { label: 'Admin' }, { label: 'Logs' }]}
      />
      <div>
        <h1 className="athena-title text-3xl">Logs administrativos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Auditoria de ações do sistema</p>
      </div>
      <AdminLogsPanel accessToken={accessToken} />
    </div>
  );
}
