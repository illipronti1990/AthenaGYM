import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DocumentsPanel } from '@/modules/admin/AdminPanels';

export default async function Page() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Admin', href: '/app/admin/dashboard' }, { label: 'Documentos' }]} />
      <div>
        <h1 className="movvo-title text-3xl">Documentos</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Arquivos e vencimentos</p>
      </div>
      <DocumentsPanel accessToken={accessToken} />
    </div>
  );
}
